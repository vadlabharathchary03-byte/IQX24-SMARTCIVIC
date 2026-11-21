import re
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from db import get_connection, init_db
from sms_service import send_otp_sms

# Initialize Flask application
app = Flask(__name__)
app.config.from_object(Config)

# Auto-initialize database on application startup
with app.app_context():
    init_db()

# -------------------------------------------------------------
# Helper Decorators & Utilities
# -------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def validate_indian_phone(phone: str) -> bool:
    """Validates standard 10-digit Indian mobile numbers starting with 6, 7, 8, or 9."""
    if not phone:
        return False
    clean = re.sub(r'\D', '', phone)
    return bool(re.match(r'^[6-9]\d{9}$', clean))

def mask_phone_number(phone: str) -> str:
    """Masks phone number: 9876543210 -> +91 ******3210"""
    clean = re.sub(r'\D', '', phone)
    if len(clean) >= 4:
        return f"+91 ******{clean[-4:]}"
    return f"+91 {clean}"

# -------------------------------------------------------------
# Web Page Routes (HTML Views)
# -------------------------------------------------------------
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    return render_template('login.html', dev_mode=Config.DEV_MODE)

@app.route('/verify-otp')
def otp_page():
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    
    phone = session.get('pending_phone')
    if not phone:
        return redirect(url_for('login_page'))
    
    masked_phone = mask_phone_number(phone)
    return render_template(
        'otp.html',
        phone=phone,
        masked_phone=masked_phone,
        resend_cooldown=Config.OTP_RESEND_COOLDOWN_SECONDS,
        dev_mode=Config.DEV_MODE
    )

@app.route('/dashboard')
@login_required
def dashboard_page():
    return render_template(
        'dashboard.html',
        phone=session.get('phone_number'),
        masked_phone=mask_phone_number(session.get('phone_number', '')),
        user_id=session.get('user_id'),
        login_time=session.get('logged_in_at', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# -------------------------------------------------------------
# REST API Endpoints (AJAX Operations)
# -------------------------------------------------------------
@app.route('/api/send-otp', methods=['POST'])
def api_send_otp():
    """
    Validates phone number, enforces rate limits, generates a 6-digit OTP,
    hashes it, stores it in MySQL with 5-min expiry, and dispatches SMS.
    """
    data = request.get_json(silent=True) or {}
    raw_phone = data.get('phone', '').strip()

    # 1. 10-digit validation
    clean_phone = re.sub(r'\D', '', raw_phone)
    if not validate_indian_phone(clean_phone):
        return jsonify({
            'success': False,
            'message': 'Please enter a valid 10-digit Indian mobile number (starts with 6-9).'
        }), 400

    now = datetime.now()

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 2. Check and enforce rate limits
            cursor.execute("SELECT * FROM otp_rate_limits WHERE phone_number = %s", (clean_phone,))
            rate_entry = cursor.fetchone()

            if rate_entry:
                last_request = rate_entry['last_request_at']
                window_start = rate_entry['window_start']
                request_count = rate_entry['request_count']

                # 30-Second Cooldown between successive OTP requests
                cooldown_delta = (now - last_request).total_seconds()
                if cooldown_delta < Config.OTP_RESEND_COOLDOWN_SECONDS:
                    wait_time = int(Config.OTP_RESEND_COOLDOWN_SECONDS - cooldown_delta)
                    return jsonify({
                        'success': False,
                        'message': f"Please wait {wait_time}s before requesting a new OTP.",
                        'cooldown_remaining': wait_time
                    }), 429

                # Hourly limit: Max 5 OTP requests per hour
                window_delta = (now - window_start).total_seconds()
                if window_delta < 3600:
                    if request_count >= Config.OTP_HOURLY_LIMIT:
                        return jsonify({
                            'success': False,
                            'message': f"Maximum OTP requests ({Config.OTP_HOURLY_LIMIT}/hour) reached. Please try again later."
                        }), 429
                    # Increment counter in current window
                    cursor.execute(
                        "UPDATE otp_rate_limits SET request_count = request_count + 1, last_request_at = %s WHERE phone_number = %s",
                        (now, clean_phone)
                    )
                else:
                    # New 1-hour window
                    cursor.execute(
                        "UPDATE otp_rate_limits SET request_count = 1, window_start = %s, last_request_at = %s WHERE phone_number = %s",
                        (now, now, clean_phone)
                    )
            else:
                # First request for this number
                cursor.execute(
                    "INSERT INTO otp_rate_limits (phone_number, request_count, window_start, last_request_at) VALUES (%s, 1, %s, %s)",
                    (clean_phone, now, now)
                )

            # 3. Invalidate previous active OTPs for this number
            cursor.execute(
                "UPDATE otp_verifications SET is_used = 1 WHERE phone_number = %s AND is_used = 0",
                (clean_phone,)
            )

            # 4. Generate cryptographically secure 6-digit OTP
            otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
            otp_hash = generate_password_hash(otp_code)
            expires_at = now + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)

            # 5. Store hashed OTP in MySQL
            cursor.execute(
                """
                INSERT INTO otp_verifications 
                (phone_number, otp_hash, attempts, max_attempts, is_used, expires_at)
                VALUES (%s, %s, 0, %s, 0, %s)
                """,
                (clean_phone, otp_hash, Config.OTP_MAX_ATTEMPTS, expires_at)
            )

        conn.close()

        # 6. Send SMS via configured service or print in terminal (Dev Mode)
        sms_sent, sms_msg = send_otp_sms(clean_phone, otp_code)

        # 7. Set pending phone in session
        session['pending_phone'] = clean_phone

        response_data = {
            'success': True,
            'message': 'OTP sent successfully to your phone number.',
            'redirect_url': url_for('otp_page'),
            'cooldown_seconds': Config.OTP_RESEND_COOLDOWN_SECONDS
        }

        # Include developer hint if in dev mode
        if Config.DEV_MODE:
            response_data['dev_hint'] = f"[DEV MODE] Terminal OTP: {otp_code}"

        return jsonify(response_data), 200

    except Exception as e:
        app.logger.error(f"Error in send-otp: {e}")
        return jsonify({
            'success': False,
            'message': 'Database connection error. Please ensure MySQL is running.'
        }), 500


@app.route('/api/verify-otp', methods=['POST'])
def api_verify_otp():
    """
    Verifies the 6-digit OTP against the stored hash in MySQL.
    Enforces 5-minute expiry and locks out after 3 invalid attempts.
    """
    data = request.get_json(silent=True) or {}
    user_otp = data.get('otp', '').strip()
    phone = data.get('phone', '').strip() or session.get('pending_phone', '')

    clean_phone = re.sub(r'\D', '', phone)

    if not clean_phone or not validate_indian_phone(clean_phone):
        return jsonify({'success': False, 'message': 'Invalid phone number session.'}), 400

    if not user_otp or len(user_otp) != 6 or not user_otp.isdigit():
        return jsonify({'success': False, 'message': 'Please enter a complete 6-digit OTP code.'}), 400

    now = datetime.now()

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 1. Fetch latest unused OTP record
            cursor.execute(
                """
                SELECT * FROM otp_verifications
                WHERE phone_number = %s AND is_used = 0
                ORDER BY id DESC LIMIT 1
                """,
                (clean_phone,)
            )
            otp_record = cursor.fetchone()

            if not otp_record:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'No active OTP found. Please request a new OTP.'
                }), 400

            record_id = otp_record['id']
            attempts = otp_record['attempts']
            max_attempts = otp_record['max_attempts']
            expires_at = otp_record['expires_at']
            otp_hash = otp_record['otp_hash']

            # 2. Check 5-minute expiration
            if now > expires_at:
                cursor.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = %s", (record_id,))
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'OTP has expired (5-minute limit). Please request a new code.'
                }), 400

            # 3. Check attempt limit (Max 3 attempts)
            if attempts >= max_attempts:
                cursor.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = %s", (record_id,))
                conn.close()
                return jsonify({
                    'success': False,
                    'message': f'Maximum attempts exceeded ({max_attempts}/{max_attempts}). This OTP is blocked. Please request a new code.'
                }), 400

            # 4. Verify OTP cryptographic hash
            is_valid = check_password_hash(otp_hash, user_otp)

            if not is_valid:
                new_attempts = attempts + 1
                remaining = max_attempts - new_attempts

                if remaining <= 0:
                    # Invalidate OTP on 3rd failed attempt
                    cursor.execute(
                        "UPDATE otp_verifications SET attempts = %s, is_used = 1 WHERE id = %s",
                        (new_attempts, record_id)
                    )
                    conn.close()
                    return jsonify({
                        'success': False,
                        'message': 'Incorrect OTP. You have exhausted all 3 attempts. This OTP is now locked. Please request a new code.',
                        'remaining_attempts': 0
                    }), 400
                else:
                    cursor.execute(
                        "UPDATE otp_verifications SET attempts = %s WHERE id = %s",
                        (new_attempts, record_id)
                    )
                    conn.close()
                    return jsonify({
                        'success': False,
                        'message': f'Incorrect OTP. {remaining} attempt(s) remaining.',
                        'remaining_attempts': remaining
                    }), 400

            # 5. OTP matches! Mark as used
            cursor.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = %s", (record_id,))

            # 6. Upsert user in `users` table
            cursor.execute(
                """
                INSERT INTO users (phone_number, last_login_at)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE last_login_at = %s
                """,
                (clean_phone, now, now)
            )

            # Retrieve user record
            cursor.execute("SELECT * FROM users WHERE phone_number = %s", (clean_phone,))
            user = cursor.fetchone()

        conn.close()

        # 7. Establish secure user session
        session['user_id'] = user['id']
        session['phone_number'] = user['phone_number']
        session['logged_in_at'] = now.strftime("%d %b %Y, %I:%M %p")
        session.pop('pending_phone', None)

        return jsonify({
            'success': True,
            'message': 'Verification successful! Welcome to Ravali.',
            'redirect_url': url_for('dashboard_page')
        }), 200

    except Exception as e:
        app.logger.error(f"Error in verify-otp: {e}")
        return jsonify({
            'success': False,
            'message': 'Database error during verification. Please check MySQL.'
        }), 500

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  🚀 Ravali Authentication Server Starting on http://127.0.0.1:5000")
    print(f"  🔧 Dev Mode: {'ENABLED (OTP prints to terminal)' if Config.DEV_MODE else 'DISABLED (Real SMS Gateway)'}")
    print(f"  🗄️ MySQL Database: {Config.DB_NAME}@{Config.DB_HOST}:{Config.DB_PORT}")
    print("=" * 60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
