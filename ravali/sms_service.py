import logging
import requests
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_otp_sms(phone_number: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends the 6-digit OTP code to the given Indian phone number.
    
    1. If DEV_MODE is True: Prints the OTP clearly to the terminal for instant, free testing.
    2. If SMS_PROVIDER is 'twilio': Sends real SMS using Twilio REST API.
    3. If SMS_PROVIDER is 'msg91': Sends real SMS using MSG91 API.
    """
    clean_phone = phone_number.strip()
    formatted_phone = f"+91{clean_phone}" if not clean_phone.startswith('+') else clean_phone
    message_body = f"Your Ravali verification code is {otp_code}. Valid for 5 minutes. Do not share this code with anyone."

    # 1. Dev Mode (No SMS credits required!)
    if Config.DEV_MODE:
        border = "=" * 64
        print(f"\n{border}")
        print("  🚀 [RAVALI DEV MODE] - SMS DISPATCH SIMULATION")
        print(f"  Recipient Mobile : {formatted_phone}")
        print(f"  6-Digit OTP Code : >> {otp_code} <<")
        print("  Validity         : 5 Minutes (Max 3 attempts)")
        print(f"{border}\n")
        return True, "OTP logged to server terminal (Dev Mode enabled)"

    # 2. Twilio Provider
    if Config.SMS_PROVIDER == 'twilio':
        if not Config.TWILIO_ACCOUNT_SID or not Config.TWILIO_AUTH_TOKEN or not Config.TWILIO_PHONE_NUMBER:
            logger.warning("Twilio credentials not configured in .env. Falling back to terminal display.")
            print(f"\n[DEV FALLBACK] Ravali OTP for {formatted_phone}: {otp_code}\n")
            return True, "Twilio unconfigured: OTP printed to terminal"

        try:
            from twilio.rest import Client
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=Config.TWILIO_PHONE_NUMBER,
                to=formatted_phone
            )
            logger.info(f"Twilio SMS sent. SID: {message.sid}")
            return True, "SMS sent successfully via Twilio"
        except Exception as e:
            logger.error(f"Twilio error: {e}")
            # Fallback to terminal so testing doesn't break
            print(f"\n[TWILIO ERROR FALLBACK] Ravali OTP for {formatted_phone}: {otp_code}\n")
            return False, f"SMS Gateway Error: {str(e)}"

    # 3. MSG91 Provider
    elif Config.SMS_PROVIDER == 'msg91':
        if not Config.MSG91_AUTH_KEY:
            logger.warning("MSG91 Auth Key not configured in .env.")
            print(f"\n[DEV FALLBACK] Ravali OTP for {formatted_phone}: {otp_code}\n")
            return True, "MSG91 unconfigured: OTP printed to terminal"

        try:
            url = "https://control.msg91.com/api/v5/otp"
            payload = {
                "template_id": Config.MSG91_TEMPLATE_ID,
                "mobile": f"91{clean_phone}",
                "authkey": Config.MSG91_AUTH_KEY,
                "otp": otp_code
            }
            res = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
            data = res.json()
            if data.get('type') == 'success':
                return True, "SMS sent successfully via MSG91"
            else:
                return False, data.get('message', 'Failed to send SMS via MSG91')
        except Exception as e:
            logger.error(f"MSG91 error: {e}")
            print(f"\n[MSG91 ERROR FALLBACK] Ravali OTP for {formatted_phone}: {otp_code}\n")
            return False, f"MSG91 Gateway Error: {str(e)}"

    # Default fallback
    print(f"\n[DEV SIMULATION] Ravali OTP for {formatted_phone}: {otp_code}\n")
    return True, "OTP generated (Dev Mode)"
