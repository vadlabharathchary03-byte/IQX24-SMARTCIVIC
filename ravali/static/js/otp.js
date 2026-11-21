/**
 * Ravali Authentication - 6-Digit OTP Verification Script
 */
document.addEventListener('DOMContentLoaded', () => {
    const otpBoxes = document.querySelectorAll('.otp-box');
    const verifyForm = document.getElementById('verifyForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');
    const alertBox = document.getElementById('alertBox');
    const alertMsg = document.getElementById('alertMsg');
    const resendBtn = document.getElementById('resendBtn');
    const timerText = document.getElementById('timerText');
    const attemptsBadge = document.getElementById('attemptsBadge');

    let countdownSeconds = parseInt(resendBtn.dataset.cooldown || '30', 10);
    let timerInterval = null;

    // Focus the first input box automatically
    if (otpBoxes.length > 0) {
        otpBoxes[0].focus();
    }

    // ---------------------------------------------------------
    // 6-Digit Input Box Event Handlers
    // ---------------------------------------------------------
    otpBoxes.forEach((box, index) => {
        // Handle character input
        box.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            box.value = val ? val[val.length - 1] : '';

            if (box.value) {
                box.classList.add('filled');
                // Auto-advance focus to the next box
                if (index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                } else {
                    // Last box filled, enable verify button and blur
                    checkCompleteOtp();
                }
            } else {
                box.classList.remove('filled');
            }
            hideAlert();
        });

        // Handle navigation keys (Backspace, Arrows)
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!box.value && index > 0) {
                    // Move to previous box if current is empty
                    otpBoxes[index - 1].focus();
                    otpBoxes[index - 1].value = '';
                    otpBoxes[index - 1].classList.remove('filled');
                } else {
                    box.value = '';
                    box.classList.remove('filled');
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                otpBoxes[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        // Handle Paste (User pastes entire 6-digit code e.g. "491823")
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text');
            const cleanDigits = pastedData.replace(/\D/g, '').slice(0, 6);

            if (cleanDigits.length > 0) {
                cleanDigits.split('').forEach((digit, i) => {
                    if (otpBoxes[i]) {
                        otpBoxes[i].value = digit;
                        otpBoxes[i].classList.add('filled');
                    }
                });

                // Focus next empty or the last one
                if (cleanDigits.length < 6) {
                    otpBoxes[cleanDigits.length].focus();
                } else {
                    otpBoxes[5].focus();
                    verifyBtn.focus();
                }
                checkCompleteOtp();
            }
        });
    });

    function getEnteredOtp() {
        let code = '';
        otpBoxes.forEach(b => { code += b.value; });
        return code;
    }

    function checkCompleteOtp() {
        const code = getEnteredOtp();
        verifyBtn.disabled = (code.length !== 6);
    }

    function clearOtpBoxes() {
        otpBoxes.forEach(b => {
            b.value = '';
            b.classList.remove('filled');
        });
        if (otpBoxes.length > 0) {
            otpBoxes[0].focus();
        }
        checkCompleteOtp();
    }

    // ---------------------------------------------------------
    // 30-Second Resend Countdown Timer
    // ---------------------------------------------------------
    function startCountdown(seconds) {
        countdownSeconds = seconds;
        resendBtn.disabled = true;
        clearInterval(timerInterval);

        updateTimerDisplay();

        timerInterval = setInterval(() => {
            countdownSeconds--;
            updateTimerDisplay();

            if (countdownSeconds <= 0) {
                clearInterval(timerInterval);
                resendBtn.disabled = false;
                timerText.textContent = '';
                resendBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Resend OTP';
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const mm = String(Math.floor(countdownSeconds / 60)).padStart(2, '0');
        const ss = String(countdownSeconds % 60).padStart(2, '0');
        timerText.textContent = `(${mm}:${ss})`;
        resendBtn.innerHTML = `<i class="bi bi-clock me-1"></i> Resend code <span id="timerText">(${mm}:${ss})</span>`;
    }

    // Start timer on page load
    startCountdown(countdownSeconds);

    // Resend OTP Click
    resendBtn.addEventListener('click', async () => {
        if (resendBtn.disabled) return;

        resendBtn.disabled = true;
        resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Sending...';
        hideAlert();

        try {
            const phone = document.getElementById('rawPhone').value;
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showAlert('A new 6-digit OTP has been dispatched to your mobile.', 'success');
                clearOtpBoxes();
                startCountdown(data.cooldown_seconds || 30);
                if (data.dev_hint) {
                    console.log(`%c${data.dev_hint}`, 'color: #06b6d4; font-weight: bold; font-size: 14px;');
                }
            } else {
                showAlert(data.message || 'Failed to resend OTP.', 'danger');
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Resend OTP';
            }
        } catch (err) {
            console.error('Resend error:', err);
            showAlert('Server connection failed.', 'danger');
            resendBtn.disabled = false;
            resendBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Resend OTP';
        }
    });

    // ---------------------------------------------------------
    // Verify OTP Submission
    // ---------------------------------------------------------
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const code = getEnteredOtp();
        if (code.length !== 6) {
            showAlert('Please enter all 6 digits of your OTP.', 'danger');
            return;
        }

        setLoading(true);
        hideAlert();

        const phone = document.getElementById('rawPhone').value;

        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone, otp: code })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlert(data.message || 'Success! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect_url || '/dashboard';
                }, 600);
            } else {
                showAlert(data.message || 'Invalid OTP code entered.', 'danger');
                
                // Update remaining attempts badge if returned
                if (data.remaining_attempts !== undefined) {
                    if (data.remaining_attempts === 0) {
                        attemptsBadge.innerHTML = '<span class="badge bg-danger">0 Attempts Remaining (Locked)</span>';
                    } else {
                        attemptsBadge.innerHTML = `<span class="badge bg-warning text-dark">${data.remaining_attempts} Attempt(s) Remaining</span>`;
                    }
                }

                setLoading(false);
                clearOtpBoxes();
            }
        } catch (error) {
            console.error('Verify error:', error);
            showAlert('Verification failed due to a server connection issue.', 'danger');
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        verifyBtn.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'Verifying...';
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Verify & Sign In';
            checkCompleteOtp();
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
