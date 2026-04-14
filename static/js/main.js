document.addEventListener('DOMContentLoaded', async () => {
    // Helper function to make authenticated fetch requests
    const fetchAuthenticated = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        // If unauthorized, redirect to login
        if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '/login';
            return null; // Return null to indicate failure or redirect
        }

        return response;
    };

    const signupForm = document.querySelector('.signup-form');
    const loginForm = document.querySelector('.login-form');
    const otpForm = document.querySelector('.otp-form'); // Assuming you have an otp form
    const logoutBtn = document.querySelector('#logout-btn');

    // Function to update UI based on authentication status
    const updateAuthUI = () => {
        const isLoggedIn = localStorage.getItem('token') !== null;
        const navLogin = document.getElementById('nav-login');
        const navSignup = document.getElementById('nav-signup');
        const navProfile = document.getElementById('nav-profile');
        const navLogout = document.getElementById('nav-logout');

        if (navLogin && navSignup && navProfile && navLogout) {
            if (isLoggedIn) {
                navLogin.style.display = 'none';
                navSignup.style.display = 'none';
                navProfile.style.display = 'list-item';
                navLogout.style.display = 'list-item';
            } else {
                navLogin.style.display = 'list-item';
                navSignup.style.display = 'list-item';
                navProfile.style.display = 'none';
                navLogout.style.display = 'none';
            }
        }
    };

    // Initial UI update
    updateAuthUI();

    // --- Hero Animations ---
    const initHeroAnimation = () => {
        const heroIconsContainer = document.getElementById('hero-floating-icons');
        if (!heroIconsContainer) return;

        const icons = [
            'https://img.icons8.com/fluency/80/000000/plumbing.png',
            'https://img.icons8.com/fluency/80/000000/electrical.png',
            'https://img.icons8.com/fluency/80/000000/cleaning-service.png',
            'https://img.icons8.com/fluency/80/000000/home-carer.png',
            'https://img.icons8.com/fluency/80/000000/maintenance.png',
            'https://img.icons8.com/fluency/80/000000/paint-roller.png'
        ];

        for (let i = 0; i < 12; i++) {
            const icon = document.createElement('div');
            icon.classList.add('floating-icon');
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];
            icon.innerHTML = `<img src="${randomIcon}" alt="service icon">`;
            
            // Random positioning and animation delay
            const left = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = 10 + Math.random() * 10;
            const size = 40 + Math.random() * 40;

            icon.style.left = `${left}%`;
            icon.style.animationDelay = `${delay}s`;
            icon.style.animationDuration = `${duration}s`;
            icon.querySelector('img').style.width = `${size}px`;
            icon.querySelector('img').style.height = `${size}px`;

            heroIconsContainer.appendChild(icon);
        }
    };

    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/local/client/')) {
        initHeroAnimation();
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId'); // Also remove userId
            updateAuthUI(); // Update UI after logout
            window.location.href = '/login';
        });
    }

    // --- Signup ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.querySelector('input[type="email"]').value;
            const password = signupForm.querySelector('input[type="password"]').value;

            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to OTP page
                alert(data.message); // "OTP sent to your email."
                window.location.href = `/otp?email=${email}`;
            } else {
                alert(data.message);
            }
        });
    }

    // --- OTP Verification ---
    // This is a simplified example. You would have a separate page or a modal for OTP.
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = otpForm.querySelector('input[name="email"]').value; // hidden input
            const otp = otpForm.querySelector('input[name="otp"]').value;

            const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // "OTP verified successfully. Please login."
                window.location.href = '/login';
            } else {
                alert(data.message); // "Invalid OTP."
            }
        });
    }


    // --- Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('userId', data.id);
                updateAuthUI(); // Update UI after successful login
                window.location.href = '/profile';
            } else {
                alert(data.message);
            }
        });
    }

    // --- Fetch and display partners on the partners page ---
    if (window.location.pathname === '/partners') {
        const partnerList = document.querySelector('.partner-list');
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('service_id');
        const searchKeyword = urlParams.get('search');

        let apiUrl = 'http://localhost:3000/api/services/search?keyword='; // Default to a general search
        if (serviceId) {
            apiUrl = `http://localhost:3000/api/services/${serviceId}/partners`;
        } else if (searchKeyword) {
            apiUrl = `http://localhost:3000/api/services/search?keyword=${searchKeyword}`;
        }


        if (partnerList) {
            // Note: Pug already renders initial list, this is for search/filter updates if needed
            // Or we can let Pug handle the initial render and JS handle the search results
            if (searchKeyword || serviceId) {
                fetch(apiUrl)
                    .then(response => response.json())
                    .then(partners => {
                        if (partners.length === 0) {
                            partnerList.innerHTML = '<p style="text-align: center;">No professionals found for this selection.</p>';
                            return;
                        }
                        partnerList.innerHTML = ''; // Clear initial Pug render for specific results
                        partners.forEach(partner => {
                            const partnerDiv = document.createElement('div');
                            partnerDiv.classList.add('partner-item');
                            const partnerName = partner.partner_name || partner.name;
                            const partnerDescription = partner.description || "No description available.";
                            const partnerPricing = partner.pricing || "Contact for pricing.";
                            const partnerImage = partner.profile_image || 'https://via.placeholder.com/300x200?text=Pro+Image';
                            const partnerId = partner.id || partner.partner_id;
                            const finalServiceId = partner.service_id || serviceId;

                            partnerDiv.innerHTML = `
                                <img src="${partnerImage}" alt="${partnerName}">
                                <div class="partner-item-content">
                                    <h4>${partnerName}</h4>
                                    <p>${partnerDescription}</p>
                                    <p><strong>Pricing:</strong> ${partnerPricing}</p>
                                    <a href="/booking?partner_id=${partnerId}&service_id=${finalServiceId}" class="button">Book Now</a>
                                </div>
                            `;
                            partnerList.appendChild(partnerDiv);
                        });
                    });
            }
        }
         // --- Search functionality on partners page ---
        const searchForm = document.querySelector('.services-section .search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const keyword = searchForm.querySelector('input').value;
                window.location.href = `/partners?search=${keyword}`;
            });
        }
    }

    // --- Handle search on other pages ---
    const globalSearchForms = document.querySelectorAll('.search-form');
    globalSearchForms.forEach(form => {
        if (form.closest('.services-section')) return; // Already handled above
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyword = form.querySelector('input').value;
            window.location.href = `/partners?search=${keyword}`;
        });
    });

    // --- Booking Page Logic ---
    if (window.location.pathname.endsWith('booking.html') || window.location.pathname === '/booking') {
        const bookingDetailsContainer = document.querySelector('.service-details');
        const costSummaryContainer = document.querySelector('.cost-summary');
        const bookingForm = document.querySelector('.booking-form');
        const urlParams = new URLSearchParams(window.location.search);
        const partnerId = urlParams.get('partner_id');
        const serviceId = urlParams.get('service_id');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('Please login to book a service.');
            window.location.href = '/login';
            return;
        }

        // Fetch partner and service details (you might need to create separate endpoints for this)
        // This is a simplified example
        let serviceCost = 100; // Dummy service cost
        let isFirstBooking = true; // You need to fetch this from the backend

        // Display dummy details
        bookingDetailsContainer.innerHTML = `<p>Booking service from Partner ${partnerId}</p>`;

        // Calculate and display cost
        const handlingFee = isFirstBooking ? 0 : serviceCost * 0.05;
        const tax = serviceCost * 0.02;
        const totalCost = serviceCost + handlingFee + tax;

        costSummaryContainer.innerHTML = `
            <p>Service Cost: £${serviceCost.toFixed(2)}</p>
            <p>Handling Fee: £${handlingFee.toFixed(2)}</p>
            <p>Tax (2%): £${tax.toFixed(2)}</p>
            <p><strong>Total: £${totalCost.toFixed(2)}</strong></p>
        `;

        // Handle booking submission
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = bookingForm.querySelector('input[type="date"]').value;
            const time = bookingForm.querySelector('input[type="time"]').value;
            const address = bookingForm.querySelector('textarea').value;

            // First, save the address (you need a default address selection or a new address form)
            // This is a simplified example where we just use the text from the textarea
            // In a real app, you'd have a proper address management system.

            const addressResponse = await fetchAuthenticated(`http://localhost:3000/api/profile/${userId}/addresses`, {
                method: 'POST',
                body: JSON.stringify({ address: address, city: '', state: '', zip_code: '' })
            });
            if (!addressResponse) return; // fetchAuthenticated handled redirect
            const addressData = await addressResponse.json();
            if (!addressResponse.ok) {
                alert('Error saving address');
                return;
            }
            const addressId = addressData.id;


            const bookingResponse = await fetchAuthenticated('http://localhost:3000/api/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    partner_id: partnerId,
                    service_id: serviceId,
                    booking_date: date,
                    booking_time: time,
                    address_id: addressId,
                    total_cost: serviceCost,
                    is_first_booking: isFirstBooking
                })
            });
            if (!bookingResponse) return; // fetchAuthenticated handled redirect

            const bookingData = await bookingResponse.json();
            if (bookingResponse.ok) {
                alert('Booking successful!');
                window.location.href = `/profile#booking-${bookingData.id}`;
            } else {
                alert('Error making booking: ' + bookingData.message);
            }
        });
    }

    // --- Profile Page Logic ---
    if (window.location.pathname.endsWith('profile.html') || window.location.pathname === '/profile') {
        const userDetailsContainer = document.querySelector('.user-details');
        const userAddressesContainer = document.querySelector('.user-addresses');
        const userBookingsContainer = document.querySelector('.user-bookings');
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!userId || !token) {
            alert('Please login to view your profile.');
            window.location.href = '/login';
            return;
        }

        // Fetch User Details
        const userDetailsResponse = await fetchAuthenticated(`http://localhost:3000/api/profile/${userId}`);
        if (!userDetailsResponse) return;
        const user = await userDetailsResponse.json();
        if (user) {
            userDetailsContainer.innerHTML = `
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Member Since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            `;
        }

        // Fetch User Addresses
        const userAddressesResponse = await fetchAuthenticated(`http://localhost:3000/api/profile/${userId}/addresses`);
        if (!userAddressesResponse) return;
        const addresses = await userAddressesResponse.json();
        if (addresses && addresses.length > 0) {
            userAddressesContainer.innerHTML = '<ul>' + addresses.map(addr => `<li>${addr.address}, ${addr.city || ''}</li>`).join('') + '</ul>';
        } else {
            userAddressesContainer.innerHTML = '<p>No saved addresses.</p>';
        }

        // Fetch User Bookings
        const userBookingsResponse = await fetchAuthenticated(`http://localhost:3000/api/profile/${userId}/bookings`);
        if (!userBookingsResponse) return;
        const bookings = await userBookingsResponse.json();
        if (bookings && bookings.length > 0) {
            userBookingsContainer.innerHTML = bookings.map(booking => `
                <div class="booking-item">
                    <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
                    <p><strong>Service:</strong> ${booking.service_name} with ${booking.partner_name}</p>
                    <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()} at ${booking.booking_time}</p>
                    <p><strong>Status:</strong> ${booking.status}</p>
                    <p><strong>Total Cost:</strong> £${booking.total_cost}</p>
                </div>
            `).join('');
        } else {
            userBookingsContainer.innerHTML = '<p>You have no past or upcoming bookings.</p>';
        }
    }
});
