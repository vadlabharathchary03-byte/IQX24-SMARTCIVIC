import pymysql
import pymysql.cursors
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_connection(include_db=True):
    """
    Creates and returns a connection to MySQL database.
    If include_db is False, connects to the server without selecting database (for DB creation).
    """
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
    except pymysql.MySQLError as e:
        logger.error(f"MySQL Connection Error: {e}")
        raise e

def init_db():
    """
    Ensures that the database and required tables exist upon startup.
    Executes automatically during app initialization.
    """
    try:
        # 1. Connect without DB to ensure database exists
        conn = get_connection(include_db=False)
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()

        # 2. Connect to the database and create tables
        conn = get_connection(include_db=True)
        with conn.cursor() as cursor:
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    phone_number VARCHAR(15) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login_at TIMESTAMP NULL,
                    INDEX idx_phone (phone_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # OTP Verifications table
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

            # OTP Rate Limits table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS otp_rate_limits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    phone_number VARCHAR(15) NOT NULL UNIQUE,
                    request_count INT DEFAULT 1,
                    window_start DATETIME NOT NULL,
                    last_request_at DATETIME NOT NULL,
                    INDEX idx_rate_phone (phone_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)

        conn.close()
        logger.info("MySQL database & tables initialized successfully.")
        return True
    except Exception as e:
        logger.warning(f"Could not auto-initialize MySQL ({e}). Ensure MySQL server is running.")
        return False
