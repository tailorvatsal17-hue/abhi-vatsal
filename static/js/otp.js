/**
 * OTP Verification Form Handler
 * Handles OTP form submission and verifies the code
 */

document.addEventListener('DOMContentLoaded', function() {
    const otpForm = document.querySelector('.otp-form');
    
    if (otpForm) {
        otpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.querySelector('#otp-email').value.trim();
            const otp = document.querySelector('#otp').value.trim();
            
            // Validation
            if (!email || !otp) {
                alert('Please enter OTP code');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/customer/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        otp: otp
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success - show message and redirect to login
                    alert(data.message || 'OTP verified successfully! Please login.');
                    window.location.href = '/login';
                } else {
                    // Error response
                    alert(data.message || 'Invalid or expired OTP. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
