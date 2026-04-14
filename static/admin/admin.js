document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.querySelector('.admin-login-form');
    const adminLogoutBtn = document.querySelector('#admin-logout-btn');
    const token = localStorage.getItem('adminToken');

    // Redirect to login if not on login page and no token
    if (!token && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
        window.location.href = '/admin';
    }

    // --- Admin Login ---
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = adminLoginForm.querySelector('#email').value;
            const password = adminLoginForm.querySelector('#password').value;

            const response = await fetch('http://localhost:3000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.accessToken);
                window.location.href = '/admin/dashboard';
            } else {
                alert('Login failed: ' + data.message);
            }
        });
    }

    // --- Admin Logout ---
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
        });
    }

    // --- Dashboard ---
    if (window.location.pathname === '/admin/dashboard') {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Generate Report Logic
        const reportBtn = document.getElementById('generate-report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', async () => {
                try {
                    const [users, partners, bookings] = await Promise.all([
                        fetch('http://localhost:3000/api/admin/users', { headers }).then(res => res.json()),
                        fetch('http://localhost:3000/api/admin/partners', { headers }).then(res => res.json()),
                        fetch('http://localhost:3000/api/admin/bookings', { headers }).then(res => res.json())
                    ]);

                    let csvContent = "data:text/csv;charset=utf-8,";
                    
                    // Finance & Overall Section
                    const totalEarnings = bookings.filter(b => b.status === 'Completed').reduce((s, b) => s + parseFloat(b.total_cost || 0), 0);
                    csvContent += "--- FINANCIAL SUMMARY ---\n";
                    csvContent += `Total Users,${users.length}\n`;
                    csvContent += `Total Partners,${partners.length}\n`;
                    csvContent += `Total Bookings,${bookings.length}\n`;
                    csvContent += `Total Earnings,£${totalEarnings.toFixed(2)}\n\n`;

                    // Users Section
                    csvContent += "--- USER ACTIVITY ---\n";
                    csvContent += "ID,Email,Registered On\n";
                    users.forEach(u => csvContent += `${u.id},${u.email},${u.created_at}\n`);
                    csvContent += "\n";

                    // Partners Section
                    csvContent += "--- PARTNER ACTIVITY ---\n";
                    csvContent += "ID,Name,Email,Status,Rating\n";
                    partners.forEach(p => csvContent += `${p.id},${p.name},${p.email},${p.is_approved ? 'Approved' : 'Pending'},${p.rating}\n`);
                    csvContent += "\n";

                    // Bookings Section
                    csvContent += "--- ALL BOOKINGS ---\n";
                    csvContent += "ID,User ID,Partner ID,Date,Status,Cost\n";
                    bookings.forEach(b => csvContent += `${b.id},${b.user_id},${b.partner_id},${b.booking_date},${b.status},${b.total_cost}\n`);

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `LSP_Full_Report_${new Date().toLocaleDateString()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    alert("Error generating report: " + error.message);
                }
            });
        }

        // Fetch Total Users
        fetch('http://localhost:3000/api/admin/users', { headers })
            .then(res => res.json())
            .then(data => {
                document.getElementById('total-users').textContent = data.length;
            });

        // Fetch Total Partners
        fetch('http://localhost:3000/api/admin/partners', { headers })
            .then(res => res.json())
            .then(data => {
                document.getElementById('total-partners').textContent = data.length;
            });

        // Fetch Total Services
        fetch('http://localhost:3000/api/services', { headers })
            .then(res => res.json())
            .then(data => {
                document.getElementById('total-services').textContent = data.length;
            });

        // Fetch Total Bookings
        fetch('http://localhost:3000/api/admin/bookings', { headers })
            .then(res => res.json())
            .then(data => {
                document.getElementById('total-bookings').textContent = data.length;

                // Calculate Total Earnings
                const totalEarnings = data
                    .filter(booking => booking.status === 'Completed')
                    .reduce((sum, booking) => sum + parseFloat(booking.total_cost || 0), 0);
                document.getElementById('total-earnings').textContent = `£${totalEarnings.toFixed(2)}`;

                // Display recent bookings
                const bookingsTableContainer = document.getElementById('bookings-table');
                let table = '<table><thead><tr><th>ID</th><th>User ID</th><th>Partner ID</th><th>Status</th><th>Cost</th></tr></thead><tbody>';
                data.slice(0, 5).forEach(booking => {
                    table += `<tr>
                        <td>${booking.id}</td>
                        <td>${booking.user_id}</td>
                        <td>${booking.partner_id}</td>
                        <td>${booking.status}</td>
                        <td>£${booking.total_cost}</td>
                    </tr>`;
                });
                table += '</tbody></table>';
                bookingsTableContainer.innerHTML = table;
            });
    }

    // --- Manage Users ---
    if (window.location.pathname === '/admin/users') {
        const usersTableContainer = document.getElementById('users-table');
        const userSearchInput = document.getElementById('user-search');
        let allUsers = [];

        const renderUsers = (users) => {
            let table = '<table><thead><tr><th>ID</th><th>Email</th><th>Registered On</th><th>Actions</th></tr></thead><tbody>';
            users.forEach(user => {
                table += `<tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="button-danger" data-id="${user.id}">Block</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            usersTableContainer.innerHTML = table;
        };

        fetch('http://localhost:3000/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                allUsers = data;
                renderUsers(allUsers);
            });

        userSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user =>
                user.email.toLowerCase().includes(searchTerm)
            );
            renderUsers(filteredUsers);
        });
    }

    // --- Manage Partners ---
    if (window.location.pathname === '/admin/partners') {
        const partnersTableContainer = document.getElementById('partners-table');
        const statusFilter = document.getElementById('partner-status-filter');
        let allPartners = [];

        const renderPartners = (partners) => {
            let table = '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Service ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            partners.forEach(partner => {
                table += `<tr>
                    <td>${partner.id}</td>
                    <td>${partner.name}</td>
                    <td>${partner.email}</td>
                    <td>${partner.service_id}</td>
                    <td>${partner.is_approved ? 'Approved' : 'Pending'}</td>
                    <td>
                        <button class="button-info view-details-btn" data-id="${partner.id}">View Details</button>
                        ${!partner.is_approved ? `<button class="button-success approve-btn" data-id="${partner.id}">Approve</button>` : ''}
                        <button class="button-danger" data-id="${partner.id}">Deactivate</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            partnersTableContainer.innerHTML = table;

            const modal = document.getElementById('partner-modal');
            const closeModal = document.querySelector('.close-modal');

            if (closeModal) {
                closeModal.onclick = () => modal.style.display = 'none';
            }
            window.onclick = (event) => {
                if (event.target == modal) modal.style.display = 'none';
            };

            // Add event listeners for view details buttons
            document.querySelectorAll('.view-details-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const partnerId = e.target.dataset.id;
                    const partner = allPartners.find(p => p.id == partnerId);
                    if (partner) {
                        document.getElementById('modal-partner-id').value = partner.id;
                        document.getElementById('modal-partner-name').textContent = partner.name;
                        document.getElementById('modal-partner-email').textContent = partner.email;
                        document.getElementById('modal-partner-service').textContent = partner.service_id;
                        document.getElementById('modal-partner-description-edit').value = partner.description || '';
                        document.getElementById('modal-partner-pricing-edit').value = partner.pricing || '';
                        document.getElementById('modal-partner-rating').textContent = partner.rating;
                        document.getElementById('modal-partner-status').textContent = partner.is_approved ? 'Approved' : 'Pending';
                        
                        const img = document.getElementById('modal-partner-image');
                        if (partner.profile_image) {
                            img.src = partner.profile_image;
                            img.style.display = 'block';
                        } else {
                            img.style.display = 'none';
                        }

                        modal.style.display = 'block';
                    }
                });
            });

            const editForm = document.getElementById('edit-partner-form');
            if (editForm) {
                editForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const partnerId = document.getElementById('modal-partner-id').value;
                    const description = document.getElementById('modal-partner-description-edit').value;
                    const pricing = document.getElementById('modal-partner-pricing-edit').value;
                    const is_approved = document.getElementById('modal-partner-status').textContent === 'Approved';

                    const response = await fetch(`http://localhost:3000/api/admin/partners/${partnerId}`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ description, pricing, is_approved })
                    });

                    if (response.ok) {
                        alert('Partner details updated successfully!');
                        modal.style.display = 'none';
                        fetchPartners();
                    } else {
                        alert('Failed to update partner details.');
                    }
                };
            }

            const approvePartner = (partnerId) => {
                fetch(`http://localhost:3000/api/admin/partners/approve/${partnerId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => {
                    if (res.ok) {
                        fetchPartners();
                    } else {
                        alert('Approval failed.');
                    }
                });
            };

            // Add event listeners for approve buttons in table
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    approvePartner(e.target.dataset.id);
                });
            });
        };

        const fetchPartners = () => {
            fetch('http://localhost:3000/api/admin/partners', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    allPartners = data;
                    const filtered = statusFilter.value === 'all'
                        ? allPartners
                        : allPartners.filter(p => (p.is_approved && statusFilter.value === 'approved') || (!p.is_approved && statusFilter.value === 'pending'));
                    renderPartners(filtered);
                });
        };

        statusFilter.addEventListener('change', () => {
            const filtered = statusFilter.value === 'all'
                ? allPartners
                : allPartners.filter(p => (p.is_approved && statusFilter.value === 'approved') || (!p.is_approved && statusFilter.value === 'pending'));
            renderPartners(filtered);
        });

        fetchPartners();
    }

    // --- Manage Services ---
    if (window.location.pathname === '/admin/services') {
        const servicesTableContainer = document.getElementById('services-table');
        const addServiceForm = document.getElementById('add-service-form');

        const renderServices = (services) => {
            let table = '<table><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>';
            services.forEach(service => {
                table += `<tr>
                    <td>${service.id}</td>
                    <td>${service.name}</td>
                    <td>${service.description}</td>
                    <td>
                        <button class="button-danger delete-service-btn" data-id="${service.id}">Delete</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            servicesTableContainer.innerHTML = table;

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-service-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const serviceId = e.target.dataset.id;
                    if (confirm('Are you sure you want to delete this service?')) {
                        fetch(`http://localhost:3000/api/admin/services/${serviceId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).then(res => {
                            if (res.ok) {
                                fetchServices();
                            } else {
                                alert('Failed to delete service.');
                            }
                        });
                    }
                });
            });
        };

        const fetchServices = () => {
            fetch('http://localhost:3000/api/services', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    renderServices(data);
                });
        };

        addServiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('service-name').value;
            const description = document.getElementById('service-desc').value;
            const image = document.getElementById('service-image').value; // Get image URL

            fetch('http://localhost:3000/api/admin/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, image })
            }).then(res => {
                if (res.ok) {
                    fetchServices();
                    addServiceForm.reset();
                } else {
                    alert('Failed to add service.');
                }
            });
        });

        fetchServices();
    }

    // --- Manage Bookings ---
    if (window.location.pathname === '/admin/bookings') {
        const bookingsTableContainer = document.getElementById('bookings-management-table');
        const dateFilter = document.getElementById('date-filter');
        const statusFilter = document.getElementById('booking-status-filter');
        let allBookings = [];

        const renderBookings = (bookings) => {
            let table = '<table><thead><tr><th>ID</th><th>User ID</th><th>Partner ID</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            bookings.forEach(booking => {
                table += `<tr>
                    <td>${booking.id}</td>
                    <td>${booking.user_id}</td>
                    <td>${booking.partner_id}</td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>
                        <select class="status-selector" data-id="${booking.id}">
                            <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                         <button class="button-success save-status-btn" data-id="${booking.id}">Save</button>
                    </td>
                </tr>`;
            });
            table += '</tbody></table>';
            bookingsTableContainer.innerHTML = table;
            
            // Add event listeners for save buttons
            document.querySelectorAll('.save-status-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookingId = e.target.dataset.id;
                    const newStatus = document.querySelector(`.status-selector[data-id='${bookingId}']`).value;
                    
                    fetch(`http://localhost:3000/api/admin/bookings/${bookingId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ status: newStatus })
                    }).then(res => res.ok ? alert('Status updated') : alert('Update failed'));
                });
            });
        };
        
        const fetchBookings = () => {
            fetch('http://localhost:3000/api/admin/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    allBookings = data;
                    applyFilters();
                });
        };

        const applyFilters = () => {
            let filteredBookings = allBookings;
            const date = dateFilter.value;
            const status = statusFilter.value;

            if (date) {
                filteredBookings = filteredBookings.filter(b => b.booking_date.startsWith(date));
            }
            if (status !== 'all') {
                filteredBookings = filteredBookings.filter(b => b.status === status);
            }
            renderBookings(filteredBookings);
        }

        dateFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);

        fetchBookings();
    }
});
