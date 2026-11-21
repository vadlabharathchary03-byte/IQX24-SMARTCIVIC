# Ravali - Phone Number OTP Authentication Web Application

A clean, modern, production-ready phone number OTP authentication web application called **"Ravali"** built using **Flask (Python)**, **MySQL**, and **HTML5 / CSS3 / JavaScript / Bootstrap 5**.

---

## 🌟 Features

1. **Login Page**:
   - Fixed `+91` country code.
   - 10-digit Indian mobile number validation (`^[6-9]\d{9}$`).
   - Live digit counter (`x/10`) and dynamic button state.
2. **OTP Verification Page**:
   - 6 individual digit input boxes with auto-focus, backspace auto-reverse, arrow navigation, and full 6-digit clipboard paste support.
   - 30-second live countdown timer for Resend OTP.
   - Shows masked phone number (`+91 ******1234`) with "Edit" option.
3. **Backend & Security**:
   - Generates cryptographically secure 6-digit random OTP (`secrets.SystemRandom`).
   - Hashes the OTP using Werkzeug PBKDF2 before storing in MySQL.
   - 5-minute strict time-to-live expiration.
   - Maximum 3 invalid OTP attempts before the OTP is locked out.
   - Rate limiting: 30-second cooldown between requests & max 5 requests per hour.
4. **Dev Mode (Zero-Cost Testing)**:
   - When `DEV_MODE=True`, the OTP is printed directly in the terminal console so you can test without SMS credits or API keys!
5. **Real SMS Gateway Integration**:
   - Integrated with **Twilio** and **MSG91** REST APIs via `.env` configuration.
6. **Dashboard**:
   - Protected session view greeting: **"Welcome to Ravali"**.
   - Displays user phone, user ID, login timestamp, and security badges.
   - Secure logout button that terminates the Flask session.

---

## 📁 Folder Structure

```
ravali/
├── .env                  # Live environment variables (DB, SMS keys, Dev mode)
├── .env.example          # Template for environment variables
├── .gitignore            # Git exclusion rules
├── requirements.txt      # Python dependencies
├── schema.sql            # MySQL Database schema
├── config.py             # Configuration loader & constants
├── db.py                 # MySQL connection manager & auto-migrator
├── sms_service.py        # SMS service (Dev Mode / Twilio / MSG91)
├── app.py                # Flask application routes & security logic
├── static/
│   ├── css/
│   │   └── style.css     # Custom modern stylesheet
│   └── js/
│       ├── login.js      # Phone number validation & OTP dispatch
│       └── otp.js        # 6-box input handling & countdown timer
└── templates/
    ├── base.html         # Bootstrap 5 layout template
    ├── login.html        # Mobile number input view
    ├── otp.html          # 6-digit OTP verification view
    └── dashboard.html    # Authenticated dashboard ("Welcome to Ravali")
```

---

## 🚀 Step-by-Step Run Instructions

### Step 1: Install Python & Create Virtual Environment

Open your terminal / command prompt:

```bash
# Navigate to the ravali folder
cd ravali

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Setup MySQL Database

1. Ensure your MySQL server (or XAMPP / WampServer / Docker MySQL) is running.
2. Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal) and execute the `schema.sql` file:

```bash
mysql -u root -p < schema.sql
```

*(Note: The application also includes auto-migration in `db.py` to create the database and tables automatically if the user has database creation privileges).*

### Step 4: Configure `.env` File

Open the `.env` file and set your MySQL credentials:

```ini
# Flask
SECRET_KEY=your-random-secret-key-here

# Dev Mode: Set to True for testing without SMS credits
DEV_MODE=True

# MySQL Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ravali_db

# SMS Gateway (Optional for production)
SMS_PROVIDER=dev
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Step 5: Start the Flask Application

```bash
python app.py
```

You will see:
```
============================================================
  🚀 Ravali Authentication Server Starting on http://127.0.0.1:5000
  🔧 Dev Mode: ENABLED (OTP prints to terminal)
  🗄️ MySQL Database: ravali_db@localhost:3306
============================================================
```

### Step 6: Test the Application

1. Open your browser and go to: `http://127.0.0.1:5000`
2. Enter any 10-digit mobile number (e.g., `9876543210`) and click **Send OTP**.
3. Look at your terminal console! Because `DEV_MODE=True`, you will see:
   ```
   ================================================================
     🚀 [RAVALI DEV MODE] - SMS DISPATCH SIMULATION
     Recipient Mobile : +919876543210
     6-Digit OTP Code : >> 481920 <<
     Validity         : 5 Minutes (Max 3 attempts)
   ================================================================
   ```
4. Enter `481920` in the 6 input boxes on the OTP verification page.
5. Click **Verify & Sign In**.
6. You will be authenticated and redirected to the dashboard: **"Welcome to Ravali"**!
7. Click **Logout** to test session invalidation and redirection back to login.
