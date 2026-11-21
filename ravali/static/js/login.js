/**
 * Ravali Authentication - Login Page Script
 */
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phoneInput');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const loginForm = document.getElementById('loginForm');
    const alertBox = document.getElementById('alertBox');
    const alertMsg = document.getElementById('alertMsg');
    const charCounter = document.getElementById('charCounter');

    // Live validation as user types
    phoneInput.addEventListener('input', (e) => {
        // Strip non-digits and cap at 10 digits
        let value = e.target.value.replace(/\D/g, '').slice(0, 10);
        e.target.value = value;

        // Update digit counter
        if (charCounter) {
            charCounter.textContent = `${value.length}/10`;
            if (value.length === 10) {
                charCounter.className = 'badge bg-success-subtle text-success';
            } else {
                charCounter.className = 'badge bg-secondary-subtle text-secondary';
            }
        }

        // Validate: exactly 10 digits and starts with 6, 7, 8, or 9
        const isValid = /^[6-9]\d{9}$/.test(value);
        sendOtpBtn.disabled = !isValid;

        // Hide alert when user starts typing again
        hideAlert();
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const phone = phoneInput.value.trim();
        if (!/^[6-9]\d{9}$/.test(phone)) {
            showAlert('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.', 'danger');
            return;
        }

        setLoading(true);
        hideAlert();

        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: phone })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // If dev mode hint is available, log it
                if (data.dev_hint) {
                    console.log(`%c${data.dev_hint}`, 'color: #06b6d4; font-weight: bold; font-size: 14px;');
                }

                // Redirect to OTP verification page
                window.location.href = data.redirect_url || '/verify-otp';
            } else {
                showAlert(data.message || 'Failed to send OTP. Please try again.', 'danger');
                setLoading(false);
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            showAlert('Network or server connection failed. Please ensure the backend is running.', 'danger');
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        sendOtpBtn.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'Sending OTP...';
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Send OTP';
            // Re-check valid state
            sendOtpBtn.disabled = !/^[6-9]\d{9}$/.test(phoneInput.value.trim());
        }
    }

    function showAlert(message, type = 'danger') {
        alertMsg.textContent = message;
        alertBox.className = `custom-alert custom-alert-${type}`;
        alertBox.classList.remove('d-none');
    }

    function hideAlert() {
        alertBox.classList.add('d-none');
    }
});
