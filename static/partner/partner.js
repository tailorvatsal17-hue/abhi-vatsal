document.addEventListener('DOMContentLoaded', () => {
    const partnerLoginForm = document.querySelector('.partner-login-form');
    const partnerSignupForm = document.querySelector('.partner-signup-form');
    const partnerLogoutBtn = document.querySelector('#partner-logout-btn');
    const token = localStorage.getItem('partnerToken');
    const partnerId = localStorage.getItem('partnerId');

    // Redirect to login if not on login/signup page and no token
    if (!token && !window.location.pathname.startsWith('/partner/login') && !window.location.pathname.startsWith('/partner/signup')) {
        window.location.href = '/partner/login';
    }

    // --- Partner Login ---
    if (partnerLoginForm) {
        partnerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = partnerLoginForm.querySelector('#email').value;
            const password = partnerLoginForm.querySelector('#password').value;

            const response = await fetch('/api/auth/partner/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('partnerToken', data.accessToken);
                localStorage.setItem('partnerId', data.id);
                window.location.href = '/partner/dashboard';
            } else {
                alert('Login failed: ' + data.message);
            }
        });
    }

    // --- Partner Signup ---
    if (partnerSignupForm) {
        partnerSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = partnerSignupForm.querySelector('#name').value.trim();
            const email = partnerSignupForm.querySelector('#email').value.trim();
            const password = partnerSignupForm.querySelector('#password').value.trim();
            const service_id = partnerSignupForm.querySelector('#service_id').value.trim();
            const description = partnerSignupForm.querySelector('#description').value.trim();
            const hourly_rate = partnerSignupForm.querySelector('#hourly_rate').value.trim();

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

            const response = await fetch('/api/partners/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    service_id: parseInt(service_id), 
                    description, 
                    hourly_rate
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Your account is pending approval by the admin.');
                window.location.href = '/partner/login';
            } else {
                alert('Registration failed: ' + data.message);
            }
        });
    }

    // --- Partner Logout ---
    if (partnerLogoutBtn) {
        partnerLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('partnerToken');
            localStorage.removeItem('partnerId');
            window.location.href = '/partner/login';
        });
    }

    // Partner Availability Management
    if (window.location.pathname === '/partner/dashboard') {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Total Bookings for this partner
        fetch(`/api/partners/${partnerId}/bookings`, { headers })
            .then(res => res.json())
            .then(partnerBookings => {
                document.getElementById('total-bookings').textContent = partnerBookings.length;
                document.getElementById('pending-bookings').textContent = partnerBookings.filter(b => b.status === 'Pending').length;
                document.getElementById('completed-bookings').textContent = partnerBookings.filter(b => b.status === 'Completed').length;
                
                // Calculate earnings
                const totalEarnings = partnerBookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + parseFloat(b.total_cost || 0), 0);
                document.getElementById('total-earnings').textContent = `£${totalEarnings.toFixed(2)}`;

                // Display recent booking requests
                const bookingsTableContainer = document.getElementById('bookings-table');
                let table = '<table><thead><tr><th>ID</th><th>User</th><th>Status</th><th>Date</th><th>Time</th><th>Cost</th></tr></thead><tbody>';
                partnerBookings.slice(0, 5).forEach(booking => {
                    table += `<tr>
                        <td>${booking.id}</td>
                        <td>${booking.user_name || booking.user_id}</td>
                        <td>${booking.status}</td>
                        <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                        <td>${booking.booking_time}</td>
                        <td>£${booking.total_cost}</td>
                    </tr>`;
                });
                table += '</tbody></table>';
                bookingsTableContainer.innerHTML = table;
            });

        // Availability Management Logic
        const addAvailabilityForm = document.getElementById('add-availability-form');
        const availableDateInput = document.getElementById('available-date');
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');
        const availabilityTableContainer = document.getElementById('availability-table-container');

        const fetchPartnerAvailability = async () => {
            try {
                const response = await fetch('/api/partners/availability', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const availabilityData = await response.json();
                    renderAvailabilityTable(availabilityData);
                } else if (response.status === 404) {
                    renderAvailabilityTable([]); // No availability found
                }
                else {
                    console.error('Failed to fetch partner availability:', response.statusText);
                    alert('Failed to fetch availability.');
                }
            } catch (error) {
                console.error('Error fetching partner availability:', error);
                alert('Error fetching availability.');
            }
        };

        const renderAvailabilityTable = (availabilityData) => {
            if (availabilityData.length === 0) {
                availabilityTableContainer.innerHTML = '<p>No availability slots added yet.</p>';
                return;
            }

            let table = '<table><thead><tr><th>Date</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            availabilityData.forEach(slot => {
                table += `<tr>
                    <td>${new Date(slot.available_date).toLocaleDateString()}</td>
                    <td>${slot.start_time.substring(0, 5)}</td>
                    <td>${slot.end_time.substring(0, 5)}</td>
                    <td>${slot.status}</td>
                    <td>
                        <button class="button-danger delete-availability-btn" data-id="${slot.id}">Delete</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            availabilityTableContainer.innerHTML = table;

            document.querySelectorAll('.delete-availability-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const slotId = e.target.dataset.id;
                    if (confirm('Are you sure you want to delete this availability slot?')) {
                        await deleteAvailability(slotId);
                    }
                });
            });
        };

        const addAvailability = async (e) => {
            e.preventDefault();
            const newAvailability = {
                available_date: availableDateInput.value,
                start_time: startTimeInput.value,
                end_time: endTimeInput.value
            };

            try {
                const response = await fetch('/api/partners/availability', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newAvailability)
                });

                if (response.ok) {
                    alert('Availability added successfully!');
                    addAvailabilityForm.reset();
                    fetchPartnerAvailability(); // Refresh the table
                } else {
                    const errorData = await response.json();
                    alert('Failed to add availability: ' + (errorData.message || response.statusText));
                }
            } catch (error) {
                console.error('Error adding availability:', error);
                alert('Error adding availability.');
            }
        };

        const deleteAvailability = async (id) => {
            try {
                const response = await fetch(`/api/partners/availability/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    alert('Availability deleted successfully!');
                    fetchPartnerAvailability(); // Refresh the table
                } else {
                    const errorData = await response.json();
                    alert('Failed to delete availability: ' + (errorData.message || response.statusText));
                }
            } catch (error) {
                console.error('Error deleting availability:', error);
                alert('Error deleting availability.');
            }
        };

        addAvailabilityForm.addEventListener('submit', addAvailability);
        fetchPartnerAvailability(); // Load availability when dashboard loads
    }

    // --- Partner Bookings Management ---
    if (window.location.pathname === '/partner/bookings') {
        const bookingsTableContainer = document.getElementById('bookings-management-table');
        const statusFilter = document.getElementById('booking-status-filter');
        let allPartnerBookings = [];

        const renderPartnerBookings = (bookings) => {
            let table = '<table><thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            bookings.forEach(booking => {
                table += `<tr>
                    <td>${booking.id}</td>
                    <td>${booking.user_name || booking.user_id}</td>
                    <td>${booking.service_name || booking.service_id}</td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>${booking.booking_time}</td>
                    <td>
                        <span class="${booking.status.toLowerCase()}">${booking.status}</span>
                    </td>
                    <td>
                        ${booking.status === 'Pending' ? `
                            <button class="button-success accept-booking-btn" data-id="${booking.id}">Accept</button>
                            <button class="button-danger reject-booking-btn" data-id="${booking.id}">Reject</button>
                        ` : ''}
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            bookingsTableContainer.innerHTML = table;

            // Add event listeners for accept/reject buttons
            document.querySelectorAll('.accept-booking-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookingId = e.target.dataset.id;
                    fetch(`/api/partners/bookings/${bookingId}/accept`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (res.ok) {
                            fetchPartnerBookings(); // Refresh bookings
                            alert('Booking accepted!');
                        } else {
                            alert('Failed to accept booking.');
                        }
                    });
                });
            });

            document.querySelectorAll('.reject-booking-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookingId = e.target.dataset.id;
                    fetch(`/api/partners/bookings/${bookingId}/reject`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (res.ok) {
                            fetchPartnerBookings(); // Refresh bookings
                            alert('Booking rejected!');
                        } else {
                            alert('Failed to reject booking.');
                        }
                    });
                });
            });
        };

        const fetchPartnerBookings = () => {
            fetch(`/api/partners/${partnerId}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    allPartnerBookings = data;
                    applyPartnerBookingFilters();
                });
        };

        const applyPartnerBookingFilters = () => {
            let filteredBookings = allPartnerBookings;
            const status = statusFilter.value;

            if (status !== 'all') {
                filteredBookings = filteredBookings.filter(b => b.status === status);
            }
            renderPartnerBookings(filteredBookings);
        };

        statusFilter.addEventListener('change', applyPartnerBookingFilters);
        fetchPartnerBookings();
    }

    // --- Partner Profile Management ---
    if (window.location.pathname === '/partner/profile') {
        const profileForm = document.getElementById('partner-profile-form');
        const profileNameInput = document.getElementById('profile-name');
        const profileEmailInput = document.getElementById('profile-email');
        const profileDescriptionInput = document.getElementById('profile-description');
        const profilePricingInput = document.getElementById('profile-pricing');
        const profileImageUrlInput = document.getElementById('profile-image-url');
        const workImagesUrlInput = document.getElementById('work-images-url');

        // Fetch partner profile data
        fetch(`/api/partners/${partnerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(partner => {
            profileNameInput.value = partner.name;
            profileEmailInput.value = partner.email;
            profileDescriptionInput.value = partner.description || '';
            profilePricingInput.value = partner.pricing || '';
            profileImageUrlInput.value = partner.profile_image || '';
            workImagesUrlInput.value = partner.work_images ? partner.work_images.split(',').join(', ') : '';
        });

        // Handle form submission for profile update
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedProfile = {
                name: profileNameInput.value,
                description: profileDescriptionInput.value,
                pricing: profilePricingInput.value,
                profile_image: profileImageUrlInput.value,
                work_images: workImagesUrlInput.value.split(',').map(url => url.trim()).join(',')
            };

            fetch(`/api/partners/${partnerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedProfile)
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.message) {
                    alert(data.message);
                } else {
                    alert('Profile updated successfully!');
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                alert('Failed to update profile.');
            });
        });
    }
});