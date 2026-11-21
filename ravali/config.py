import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-ravali-dev-secret-key-391823')
    DEBUG = os.getenv('FLASK_DEBUG', '1') == '1'
    
    # Dev Mode: Prints OTP directly to console if True
    DEV_MODE = os.getenv('DEV_MODE', 'True').lower() in ('true', '1', 't')
    
    # MySQL Database settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'ravali_db')

    # Security & OTP Rules
    OTP_EXPIRY_MINUTES = 5          # OTP valid for 5 minutes
    OTP_MAX_ATTEMPTS = 3            # Limit to 3 invalid OTP attempts
    OTP_RESEND_COOLDOWN_SECONDS = 30 # 30 seconds timer before resending
    OTP_HOURLY_LIMIT = 5            # Maximum 5 OTP requests per hour per phone number

    # SMS Provider Configuration ('dev', 'twilio', 'msg91')
    SMS_PROVIDER = os.getenv('SMS_PROVIDER', 'dev').lower()

    # Twilio API credentials
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

    # MSG91 API credentials
    MSG91_AUTH_KEY = os.getenv('MSG91_AUTH_KEY', '')
    MSG91_SENDER_ID = os.getenv('MSG91_SENDER_ID', 'RAVALI')
    MSG91_TEMPLATE_ID = os.getenv('MSG91_TEMPLATE_ID', '')
