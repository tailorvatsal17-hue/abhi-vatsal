/**
 * Customer Signup Form Handler
 * Handles form submission and redirects to OTP verification page
 */

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.querySelector('.signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.querySelector('#email').value.trim();
            const password = document.querySelector('#password').value.trim();
            
            // Validation
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/customer/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success - redirect to OTP page with email parameter
                    window.location.href = `/otp?email=${encodeURIComponent(email)}`;
                } else {
                    // Error response
                    alert(data.message || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
