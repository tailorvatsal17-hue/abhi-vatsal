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

            const response = await fetch('/api/partners/login', {
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
            // Fetch services for the dropdown
        fetch('/api/services')
            .then(res => res.json())
            .then(services => {
                const serviceSelect = partnerSignupForm.querySelector('#service-id');
                if (serviceSelect) {
                    services.forEach(service => {
                        const option = document.createElement('option');
                        option.value = service.id;
                        option.textContent = service.name;
                        serviceSelect.appendChild(option);
                    });
                }
            });

        partnerSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = partnerSignupForm.querySelector('#name').value;
            const email = partnerSignupForm.querySelector('#email').value;
            const phone = partnerSignupForm.querySelector('#phone').value;
            const password = partnerSignupForm.querySelector('#password').value;
            const service_id = partnerSignupForm.querySelector('#service-id').value;
            const description = partnerSignupForm.querySelector('#description').value;
            const pricing = partnerSignupForm.querySelector('#pricing').value;

            const response = await fetch('/api/partners/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, service_id, description, pricing })
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
        const earningsLink = document.getElementById('earnings-link');
        const withdrawalLink = document.getElementById('withdrawal-link');
        const availabilityLink = document.getElementById('availability-link');
        const dashboardLink = document.querySelector('a[href="/partner/dashboard"]');
        
        const earningsSection = document.getElementById('earnings-section');
        const withdrawalSection = document.getElementById('withdrawal-section');
        const availabilitySection = document.getElementById('availability-management');
        const recentBookingsSection = document.querySelector('.recent-bookings');
        const statsCards = document.querySelector('.dashboard-stats');

        // Toggle sections
        const showSection = (sectionName) => {
            [earningsSection, withdrawalSection, availabilitySection, recentBookingsSection, statsCards].forEach(s => {
                if (s) s.style.display = 'none';
            });
            
            document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));

            if (sectionName === 'earnings') {
                earningsSection.style.display = 'block';
                earningsLink.classList.add('active');
            } else if (sectionName === 'withdrawal') {
                withdrawalSection.style.display = 'block';
                withdrawalLink.classList.add('active');
                fetchWithdrawalData();
            } else if (sectionName === 'availability') {
                availabilitySection.style.display = 'block';
                availabilityLink.classList.add('active');
            } else {
                recentBookingsSection.style.display = 'block';
                statsCards.style.display = 'flex';
                dashboardLink.classList.add('active');
            }
        };

        if (earningsLink) earningsLink.addEventListener('click', (e) => { e.preventDefault(); showSection('earnings'); });
        if (withdrawalLink) withdrawalLink.addEventListener('click', (e) => { e.preventDefault(); showSection('withdrawal'); });
        if (availabilityLink) availabilityLink.addEventListener('click', (e) => { e.preventDefault(); showSection('availability'); });
        
        const fetchWithdrawalData = async () => {
            try {
                // Fetch Summary
                const summaryRes = await fetch('/api/withdrawals/summary', { headers });
                const summary = await summaryRes.json();
                document.getElementById('available-balance').textContent = `£${parseFloat(summary.availableBalance).toFixed(2)}`;

                // Fetch History
                const historyRes = await fetch('/api/withdrawals/my', { headers });
                const history = await historyRes.json();
                const historyContainer = document.getElementById('withdrawal-history-container');
                
                if (history.length > 0) {
                    let hTable = '<table><thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
                    history.forEach(req => {
                        hTable += `<tr>
                            <td>${new Date(req.created_at).toLocaleDateString()}</td>
                            <td>£${parseFloat(req.amount).toFixed(2)}</td>
                            <td><span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span></td>
                        </tr>`;
                    });
                    hTable += '</tbody></table>';
                    historyContainer.innerHTML = hTable;
                } else {
                    historyContainer.innerHTML = '<p>No withdrawal requests found.</p>';
                }
            } catch (err) {
                console.error("Error fetching withdrawal data:", err);
            }
        };

        const withdrawalForm = document.getElementById('withdrawal-request-form');
        if (withdrawalForm) {
            withdrawalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const amount = document.getElementById('withdrawal-amount').value;
                const submitBtn = withdrawalForm.querySelector('button');

                try {
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Submitting...';

                    const response = await fetch('/api/withdrawals', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ amount })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        alert('Withdrawal request submitted successfully!');
                        withdrawalForm.reset();
                        fetchWithdrawalData();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (err) {
                    alert('An error occurred.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Submit Request';
                }
            });
        }
        dashboardLink.addEventListener('click', (e) => { 
            if (window.location.pathname === '/partner/dashboard') {
                e.preventDefault(); 
                showSection('dashboard'); 
            }
        });

        // Helper to prevent XSS
        const escapeHTML = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // Fetch Total Bookings for this partner
        fetch(`/api/partners/${partnerId}/bookings`, { headers })
            .then(res => res.json())
            .then(partnerBookings => {
                const earnedStatuses = ['Completed', 'Paid'];
                const completedJobs = partnerBookings.filter(b => earnedStatuses.includes(b.status));
                
                document.getElementById('total-bookings').textContent = partnerBookings.length;
                document.getElementById('pending-bookings').textContent = partnerBookings.filter(b => b.status === 'Pending' || b.status === 'Accepted').length;
                document.getElementById('completed-bookings').textContent = partnerBookings.filter(b => b.status === 'Completed').length;
                
                // Calculate earnings
                const totalEarnings = completedJobs.reduce((sum, b) => sum + parseFloat(b.total_cost || 0), 0);
                document.getElementById('total-earnings').textContent = `£${totalEarnings.toFixed(2)}`;
                document.getElementById('detailed-total-earnings').textContent = `£${totalEarnings.toFixed(2)}`;

                // Display recent booking requests
                const bookingsTableContainer = document.getElementById('bookings-table');
                let table = '<table><thead><tr><th>ID</th><th>User</th><th>Status</th><th>Date</th><th>Time</th><th>Cost</th></tr></thead><tbody>';
                partnerBookings.slice(0, 5).forEach(booking => {
                    table += `<tr>
                        <td>${booking.id}</td>
                        <td>${escapeHTML(booking.user_name || booking.user_id)}</td>
                        <td><span class="${booking.status.toLowerCase().replace(' ', '-')}">${booking.status}</span></td>
                        <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                        <td>${booking.booking_time}</td>
                        <td>£${parseFloat(booking.total_cost).toFixed(2)}</td>
                    </tr>`;
                });
                table += '</tbody></table>';
                bookingsTableContainer.innerHTML = table;

                // Populate Earnings Table
                const earningsTableContainer = document.getElementById('earnings-table-container');
                if (completedJobs.length > 0) {
                    let eTable = '<table><thead><tr><th>Date</th><th>Service</th><th>Customer</th><th>Amount Earned</th></tr></thead><tbody>';
                    completedJobs.forEach(job => {
                        eTable += `<tr>
                            <td>${new Date(job.booking_date).toLocaleDateString()}</td>
                            <td>${escapeHTML(job.service_name)}</td>
                            <td>${escapeHTML(job.user_name)}</td>
                            <td style="color: green; font-weight: bold;">+ £${parseFloat(job.total_cost).toFixed(2)}</td>
                        </tr>`;
                    });
                    eTable += '</tbody></table>';
                    earningsTableContainer.innerHTML = eTable;
                } else {
                    earningsTableContainer.innerHTML = '<p>No earnings found yet. Jobs appear here once Paid or Completed.</p>';
                }
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
                        <span class="${booking.status.toLowerCase().replace(' ', '-')}">${booking.status}</span>
                    </td>
                    <td>
                        ${booking.status === 'Pending' ? `
                            <button class="button-success accept-booking-btn" data-id="${booking.id}">Accept</button>
                            <button class="button-danger reject-booking-btn" data-id="${booking.id}">Reject</button>
                        ` : ''}
                        ${(booking.status === 'Accepted' || booking.status === 'Paid') ? `
                            <button class="button start-work-btn" data-id="${booking.id}">Start Work</button>
                        ` : ''}
                        ${booking.status === 'In Progress' ? `
                            <button class="button-success finish-work-btn" data-id="${booking.id}">Finish Work</button>
                        ` : ''}
                        <button class="button open-chat-btn" data-id="${booking.id}" style="background-color: #6c757d;">Chat</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            bookingsTableContainer.innerHTML = table;

            // Chat logic for partner
            const chatModal = document.getElementById('chat-modal');
            const closeChatModal = document.getElementById('close-chat-modal');
            const chatWindow = document.getElementById('partner-chat-window');
            const chatForm = document.getElementById('partner-chat-form');
            const chatInput = document.getElementById('partner-chat-message');
            let currentBookingId = null;
            let partnerChatInterval = null;

            const fetchPartnerChat = async () => {
                if (!currentBookingId) return;
                try {
                    const response = await fetch(`/api/chat/${currentBookingId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const messages = await response.json();
                        chatWindow.innerHTML = messages.map(msg => `
                            <div style="margin-bottom: 1rem; text-align: ${msg.sender_type === 'partner' ? 'right' : 'left'}">
                                <div style="display: inline-block; padding: 0.6rem 1rem; border-radius: 15px; background: ${msg.sender_type === 'partner' ? 'var(--primary-color)' : '#e4e6eb'}; color: ${msg.sender_type === 'partner' ? '#fff' : '#000'}; max-width: 80%;">
                                    <div style="font-size: 0.7rem; margin-bottom: 0.2rem; opacity: 0.8;">${msg.sender_type === 'partner' ? 'You' : 'Customer'}</div>
                                    ${escapeHTML(msg.message)}
                                    <div style="font-size: 0.6rem; margin-top: 0.2rem; opacity: 0.6;">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            </div>
                        `).join('');
                        chatWindow.scrollTop = chatWindow.scrollHeight;
                    }
                } catch (err) {
                    console.error("Partner chat fetch error:", err);
                }
            };

            document.querySelectorAll('.open-chat-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentBookingId = btn.dataset.id;
                    chatModal.style.display = 'block';
                    fetchPartnerChat();
                    partnerChatInterval = setInterval(fetchPartnerChat, 3000);
                });
            });

            closeChatModal.addEventListener('click', () => {
                chatModal.style.display = 'none';
                currentBookingId = null;
                if (partnerChatInterval) clearInterval(partnerChatInterval);
            });

            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = chatInput.value;
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ booking_id: currentBookingId, message })
                    });
                    if (response.ok) {
                        chatInput.value = '';
                        fetchPartnerChat();
                    }
                } catch (err) {
                    console.error("Partner send message error:", err);
                }
            });

            // Helper for status updates
            const updateStatus = async (bId, status, btn) => {
                const originalText = btn.innerText;
                try {
                    btn.disabled = true;
                    btn.innerText = 'Processing...';
                    
                    const response = await fetch(`/api/partners/bookings/${bId}/status`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ status })
                    });

                    if (response.ok) {
                        alert(`Job marked as ${status}!`);
                        fetchPartnerBookings();
                    } else {
                        const err = await response.json();
                        alert('Error: ' + err.message);
                        btn.disabled = false;
                        btn.innerText = originalText;
                    }
                } catch (err) {
                    alert('An error occurred.');
                    btn.disabled = false;
                    btn.innerText = originalText;
                }
            };

            // Add event listeners for accept/reject buttons
            document.querySelectorAll('.accept-booking-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookingId = e.target.dataset.id;
                    const originalText = btn.innerText;
                    btn.disabled = true;
                    btn.innerText = 'Processing...';

                    fetch(`/api/partners/bookings/${bookingId}/accept`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (res.ok) {
                            fetchPartnerBookings(); // Refresh bookings
                            alert('Booking accepted!');
                        } else {
                            alert('Failed to accept booking.');
                            btn.disabled = false;
                            btn.innerText = originalText;
                        }
                    });
                });
            });

            document.querySelectorAll('.reject-booking-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookingId = e.target.dataset.id;
                    const originalText = btn.innerText;
                    btn.disabled = true;
                    btn.innerText = 'Processing...';

                    fetch(`/api/partners/bookings/${bookingId}/reject`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (res.ok) {
                            fetchPartnerBookings(); // Refresh bookings
                            alert('Booking rejected!');
                        } else {
                            alert('Failed to reject booking.');
                            btn.disabled = false;
                            btn.innerText = originalText;
                        }
                    });
                });
            });

            // Start/Finish Work listeners
            document.querySelectorAll('.start-work-btn').forEach(btn => {
                btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'In Progress', btn));
            });

            document.querySelectorAll('.finish-work-btn').forEach(btn => {
                btn.addEventListener('click', () => updateStatus(btn.dataset.id, 'Completed', btn));
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
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;

            const updatedProfile = {
                name: profileNameInput.value,
                description: profileDescriptionInput.value,
                pricing: profilePricingInput.value,
                profile_image: profileImageUrlInput.value,
                work_images: workImagesUrlInput.value.split(',').map(url => url.trim()).join(',')
            };

            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Updating...';

                const response = await fetch(`/api/partners/${partnerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedProfile)
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Profile updated successfully!');
                } else {
                    alert('Update failed: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }
});