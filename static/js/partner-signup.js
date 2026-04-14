/**
 * Partner Signup Form Handler
 * Handles partner signup form submission
 */

document.addEventListener('DOMContentLoaded', function() {
    const partnerSignupForm = document.querySelector('.partner-signup-form');
    
    if (partnerSignupForm) {
        partnerSignupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.querySelector('#name').value.trim();
            const email = document.querySelector('#email').value.trim();
            const password = document.querySelector('#password').value.trim();
            const service_id = document.querySelector('#service_id').value.trim();
            const description = document.querySelector('#description').value.trim();
            const hourly_rate = document.querySelector('#hourly_rate').value.trim();
            
            // Validation
            if (!name || !email || !password || !service_id || !description || !hourly_rate) {
                alert('Please fill in all fields');
                return;
            }
            
            // Password validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&])[A-Za-z\d!@#$%&]{8,}$/;
            if (!passwordRegex.test(password)) {
                alert('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
                return;
            }
            
            try {
                const response = await fetch('/api/partners/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password,
                        service_id: parseInt(service_id),
                        description: description,
                        hourly_rate: hourly_rate
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success message
                    alert('Partnership signup successful! Please wait for admin approval. You can now log in.');
                    window.location.href = '/partner/login';
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
