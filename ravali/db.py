import sqlite3
import pymysql
import pymysql.cursors
import os
import re
from datetime import datetime
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check if MySQL server is reachable
def is_mysql_available():
    try:
        conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            connect_timeout=2
        )
        conn.close()
        return True
    except Exception:
        return False

USE_SQLITE = not is_mysql_available()
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), 'ravali_db.sqlite3')

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        # Convert %s placeholders to ?
        q = query.replace('%s', '?')
        # Convert MySQL ON DUPLICATE KEY UPDATE to SQLite ON CONFLICT
        if 'ON DUPLICATE KEY UPDATE' in q:
            q = re.sub(
                r'ON DUPLICATE KEY UPDATE\s+last_login_at\s*=\s*(NOW\(\)|\?)',
                'ON CONFLICT(phone_number) DO UPDATE SET last_login_at = excluded.last_login_at',
                q,
                flags=re.IGNORECASE
            )
            # Remove redundant trailing param if NOW() was replaced by ?
            if params and len(params) > 2:
                params = params[:2]

        # Convert MySQL NOW() to datetime.now()
        if 'NOW()' in q:
            q = q.replace('NOW()', '?')
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if params:
                params = list(params) + [now_str]
            else:
                params = [now_str]

        if params:
            self.cursor.execute(q, params)
        else:
            self.cursor.execute(q)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        # Convert sqlite3.Row to dict
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return SQLiteCursorWrapper(self.conn.cursor())

    def close(self):
        self.conn.commit()
        self.conn.close()

def get_connection(include_db=True):
    global USE_SQLITE
    if not USE_SQLITE:
        try:
            kwargs = {
                'host': Config.DB_HOST,
                'port': Config.DB_PORT,
                'user': Config.DB_USER,
                'password': Config.DB_PASSWORD,
                'charset': 'utf8mb4',
                'cursorclass': pymysql.cursors.DictCursor,
                'autocommit': True
            }
            if include_db:
                kwargs['database'] = Config.DB_NAME
            return pymysql.connect(**kwargs)
        except Exception as e:
            logger.warning(f"MySQL connection failed ({e}). Switching to local SQLite.")
            USE_SQLITE = True

    # SQLite Fallback Connection
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return SQLiteConnectionWrapper(conn)

def init_db():
    global USE_SQLITE
    if not USE_SQLITE:
        try:
            # 1. Connect without DB to ensure database exists
            conn = get_connection(include_db=False)
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.close()

            # 2. Connect to the database and create tables
            conn = get_connection(include_db=True)
            with conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        phone_number VARCHAR(15) NOT NULL UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login_at TIMESTAMP NULL,
                        INDEX idx_phone (phone_number)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS otp_verifications (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        phone_number VARCHAR(15) NOT NULL,
                        otp_hash VARCHAR(255) NOT NULL,
                        attempts INT DEFAULT 0,
                        max_attempts INT DEFAULT 3,
                        is_used TINYINT(1) DEFAULT 0,
                        expires_at DATETIME NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_phone_lookup (phone_number, is_used, expires_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS otp_rate_limits (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        phone_number VARCHAR(15) NOT NULL UNIQUE,
                        request_count INT DEFAULT 1,
                        window_start DATETIME NOT NULL,
                        last_request_at DATETIME NOT NULL,
                        INDEX idx_rate_phone (phone_number)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
            conn.close()
            logger.info("MySQL database & tables initialized successfully.")
            return True
        except Exception as e:
            logger.warning(f"MySQL unavailable ({e}). Initializing local SQLite database instead.")
            USE_SQLITE = True

    # Initialize SQLite schema
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP NULL
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            otp_hash TEXT NOT NULL,
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            is_used INTEGER DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS otp_rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL UNIQUE,
            request_count INTEGER DEFAULT 1,
            window_start DATETIME NOT NULL,
            last_request_at DATETIME NOT NULL
        );
    """)
    conn.commit()
    conn.close()
    logger.info("Local SQLite database initialized successfully (ravali_db.sqlite3).")
    return True
