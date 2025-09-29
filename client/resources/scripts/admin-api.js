// Admin Interface for User Management
class AdminInterface {
    constructor() {
        // Check for API service availability
        if (typeof apiService === 'undefined') {
            console.error('ApiService not available. Please ensure api-service.js is loaded.');
            return;
        }

        this.currentUser = null;
        this.users = [];
        this.rides = [];
        this.riders = [];
        this.drivers = [];
        this.messages = [];
        this.campusLocations = [];
        this.currentPage = {
            users: 1,
            rides: 1,
            messages: 1,
            locations: 1
        };
        this.itemsPerPage = 10;
        this.filters = {
            users: {},
            rides: {},
            messages: {},
            locations: {}
        };

        this.init();
    }

    init() {
        // Check for persistent login
        this.checkPersistentLogin();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    checkPersistentLogin() {
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
            try {
                this.currentUser = JSON.parse(adminUser);
                apiService.currentUserId = this.currentUser.id;
                apiService.currentUserRole = this.currentUser.role;
                this.showDashboard();
                this.loadAllData();
            } catch (error) {
                console.error('Error parsing admin user from localStorage:', error);
                this.clearLogin();
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Tab change events
        document.addEventListener('shown.bs.tab', (event) => {
            if (event.target.getAttribute('data-bs-target') === '#users') {
                this.loadUsers();
            } else if (event.target.getAttribute('data-bs-target') === '#rides') {
                this.loadRides();
            } else if (event.target.getAttribute('data-bs-target') === '#messages') {
                this.loadMessages();
            } else if (event.target.getAttribute('data-bs-target') === '#campus-locations') {
                this.loadCampusLocations();
            } else if (event.target.getAttribute('data-bs-target') === '#analytics') {
                this.loadAnalytics();
            }
        });
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadRides(),
                this.loadMessages(),
                this.loadCampusLocations(),
                this.loadAnalytics()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loginAdmin() {
        const selectedAdmin = document.getElementById('admin-select').value;
        
        if (!selectedAdmin) {
            this.showNotification('Please select an admin account.', 'warning');
            return;
        }

        try {
            // For demo purposes, directly set admin user
            this.currentUser = {
                id: 1,
                username: 'admin',
                role: 'Admin',
                firstName: 'System',
                lastName: 'Administrator'
            };
            
            // Store in localStorage for persistence
            localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
            
            apiService.currentUserId = this.currentUser.id;
            apiService.currentUserRole = this.currentUser.role;
            
            this.showDashboard();
            await this.loadAllData();
            this.showNotification('Login successful!', 'success');
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'danger');
        }
    }

    logout() {
        this.clearLogin();
        this.showLogin();
        this.showNotification('Logged out successfully.', 'info');
    }

    clearLogin() {
        localStorage.removeItem('adminUser');
        apiService.logout();
        this.currentUser = null;
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    }

    async loadUsers() {
        try {
            this.users = await apiService.getUsers();
            console.log('Loaded users:', this.users);
            this.updateUsersTable();
            this.updateUsersSummary();
        } catch (error) {
            console.error('Failed to load users:', error);
            this.users = [];
            this.updateUsersTable();
            this.showNotification('Failed to load users. Using demo data.', 'warning');
        }
    }

    // ===== RIDES MANAGEMENT =====
    async loadRides() {
        try {
            // Load rides, riders, and drivers data
            const [rides, riders, drivers] = await Promise.all([
                apiService.getAllRides(),
                apiService.getRiders(),
                apiService.getDrivers()
            ]);

            this.rides = rides;
            this.riders = riders;
            this.drivers = drivers;

            console.log('Loaded riders:', this.riders);
            console.log('Loaded drivers:', this.drivers);

            this.updateRidesTable();
            this.updateRidesSummary();
            this.populateRideFilters();
        } catch (error) {
            console.error('Failed to load rides data:', error);
            this.rides = [];
            this.riders = [];
            this.drivers = [];
            this.updateRidesTable();
            this.showNotification('Failed to load rides data. Using demo data.', 'warning');
        }
    }

    // ===== MESSAGES MANAGEMENT =====
    async loadMessages() {
        try {
            this.messages = await apiService.getAllMessages();
            this.updateMessagesTable();
            this.updateMessagesSummary();
            this.populateMessageFilters();
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.messages = [];
            this.updateMessagesTable();
            this.showNotification('Failed to load messages data.', 'warning');
        }
    }

    // ===== ANALYTICS =====
    async loadAnalytics() {
        try {
            await this.updateAnalyticsSummary();
            this.updateCharts();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    updateUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        // Apply filters
        let filteredUsers = this.users;
        
        if (this.filters.users.role) {
            filteredUsers = filteredUsers.filter(user => user.role === this.filters.users.role);
        }
        
        if (this.filters.users.status) {
            const isActive = this.filters.users.status === 'Active';
            filteredUsers = filteredUsers.filter(user => user.isActive === isActive);
        }
        
        if (this.filters.users.search) {
            const searchTerm = this.filters.users.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        const sortBy = document.getElementById('user-sort')?.value || 'username';
        filteredUsers.sort((a, b) => {
            switch (sortBy) {
                case 'username': return a.username.localeCompare(b.username);
                case 'firstName': return a.firstName.localeCompare(b.firstName);
                case 'lastName': return a.lastName.localeCompare(b.lastName);
                case 'role': return a.role.localeCompare(b.role);
                case 'createdAt': return new Date(b.createdAt) - new Date(a.createdAt);
                default: return 0;
            }
        });

        // Apply pagination
        const startIndex = (this.currentPage.users - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        paginatedUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // Create clickable name based on role
            let nameCell = '';
            if (user.role === 'Rider') {
                nameCell = `<a href="#" onclick="adminInterface.showRiderProfileByUserId(${user.id})" class="text-decoration-none">${user.firstName} ${user.lastName}</a>`;
            } else if (user.role === 'Driver') {
                nameCell = `<a href="#" onclick="adminInterface.showDriverProfileByUserId(${user.id})" class="text-decoration-none">${user.firstName} ${user.lastName}</a>`;
            } else {
                nameCell = `${user.firstName} ${user.lastName}`;
            }
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${nameCell}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span>
                </td>
                <td>
                    <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminInterface.editUser(${user.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminInterface.deleteUser(${user.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateUsersPagination(filteredUsers.length);
    }

    getRoleBadgeClass(role) {
        switch (role) {
            case 'Admin': return 'bg-danger';
            case 'Driver': return 'bg-primary';
            case 'Rider': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    updateUsersPagination(totalItems) {
        const pagination = document.getElementById('users-pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        let paginationHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage.users ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="adminInterface.goToUsersPage(${i})">${i}</a>
                </li>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    goToUsersPage(page) {
        this.currentPage.users = page;
        this.updateUsersTable();
    }

    filterUsers() {
        this.filters.users.role = document.getElementById('role-filter')?.value || '';
        this.filters.users.status = document.getElementById('status-filter')?.value || '';
        this.filters.users.search = document.getElementById('user-search')?.value || '';
        this.currentPage.users = 1;
        this.updateUsersTable();
    }

    sortUsers() {
        this.updateUsersTable();
    }

    updateUsersSummary() {
        const totalUsers = this.users.length;
        const activeDrivers = this.users.filter(u => u.role === 'Driver' && u.isActive).length;
        const activeRiders = this.users.filter(u => u.role === 'Rider' && u.isActive).length;
        const admins = this.users.filter(u => u.role === 'Admin' && u.isActive).length;

        const summaryUsers = document.getElementById('summary-users');
        const summaryDrivers = document.getElementById('summary-drivers');
        const summaryRiders = document.getElementById('summary-riders');
        const summaryAdmins = document.getElementById('summary-admins');

        if (summaryUsers) summaryUsers.textContent = totalUsers;
        if (summaryDrivers) summaryDrivers.textContent = activeDrivers;
        if (summaryRiders) summaryRiders.textContent = activeRiders;
        if (summaryAdmins) summaryAdmins.textContent = admins;
    }


    showCreateUserModal() {
        // Clear form
        document.getElementById('create-user-form').reset();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
        modal.show();
    }

    async createUser() {
        const userData = {
            username: document.getElementById('create-username').value,
            email: document.getElementById('create-email').value,
            password: 'default123', // Default password for all users
            role: document.getElementById('create-role').value,
            firstName: document.getElementById('create-firstname').value,
            lastName: document.getElementById('create-lastname').value,
            phoneNumber: 'N/A' // Default phone number
        };

        try {
            await apiService.createUser(userData);
            await this.loadUsers();
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
            modal.hide();
            
            this.showNotification('User created successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to create user. ' + error.message, 'danger');
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Populate form
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-firstname').value = user.firstName;
        document.getElementById('edit-lastname').value = user.lastName;
        document.getElementById('edit-role').value = user.role;
        document.getElementById('edit-active').checked = user.isActive;

        // Handle driver-specific fields
        this.toggleDriverFields();
        if (user.role === 'Driver' && user.driver) {
            document.getElementById('edit-driver-status').value = user.driver.status || '';
            document.getElementById('edit-driver-availability').value = user.driver.isAvailable ? 'true' : 'false';
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    }

    async updateUser() {
        const userId = document.getElementById('edit-user-id').value;
        const userData = {
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            firstName: document.getElementById('edit-firstname').value,
            lastName: document.getElementById('edit-lastname').value,
            role: document.getElementById('edit-role').value,
            isActive: document.getElementById('edit-active').checked
        };

        try {
            await apiService.updateUser(userId, userData);
            
            // If user is a driver, also update driver status
            if (userData.role === 'Driver') {
                const driverStatus = document.getElementById('edit-driver-status').value;
                const driverAvailability = document.getElementById('edit-driver-availability').value;
                
                if (driverStatus || driverAvailability) {
                    // Find the driver ID associated with this user
                    const user = this.users.find(u => u.id == userId);
                    if (user && user.driver) {
                        const statusData = {};
                        if (driverStatus) statusData.Status = driverStatus;
                        if (driverAvailability) statusData.IsAvailable = driverAvailability === 'true';
                        
                        await apiService.updateDriverStatus(user.driver.id, statusData);
                    }
                }
            }
            
            await this.loadUsers();
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            this.showNotification('User updated successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to update user. ' + error.message, 'danger');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Are you sure you want to deactivate ${user.username}?`)) {
            try {
                await apiService.deleteUser(userId);
                await this.loadUsers();
                this.showNotification('User deactivated successfully!', 'success');
            } catch (error) {
                this.showNotification('Failed to deactivate user. ' + error.message, 'danger');
            }
        }
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.alert-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed alert-notification`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Toggle driver-specific fields visibility
    toggleDriverFields(type = 'edit') {
        const roleSelect = document.getElementById(`${type}-role`);
        const driverFields = document.getElementById(`${type}-driver-fields`);
        
        if (roleSelect && driverFields) {
            if (roleSelect.value === 'Driver') {
                driverFields.style.display = 'block';
            } else {
                driverFields.style.display = 'none';
            }
        }
    }

    // ===== UTILITY METHODS =====
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // ===== RIDES TABLE WITH RIDERS AND DRIVERS =====
    updateRidesTable() {
        const tbody = document.getElementById('rides-table-body');
        if (!tbody) return;

        // Apply filters
        let filteredRides = this.rides;
        
        if (this.filters.rides.status) {
            filteredRides = filteredRides.filter(ride => ride.status === this.filters.rides.status);
        }
        
        if (this.filters.rides.driver) {
            filteredRides = filteredRides.filter(ride => ride.driverId == this.filters.rides.driver);
        }
        
        if (this.filters.rides.rider) {
            filteredRides = filteredRides.filter(ride => ride.riderId == this.filters.rides.rider);
        }
        
        if (this.filters.rides.search) {
            const searchTerm = this.filters.rides.search.toLowerCase();
            filteredRides = filteredRides.filter(ride => 
                ride.pickupLocation.toLowerCase().includes(searchTerm) ||
                ride.dropoffLocation.toLowerCase().includes(searchTerm) ||
                ride.riderName.toLowerCase().includes(searchTerm)
            );
        }

        // Apply pagination
        const startIndex = (this.currentPage.rides - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedRides = filteredRides.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        paginatedRides.forEach(ride => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ride.id}</td>
                <td><a href="#" onclick="adminInterface.showRiderProfile(${ride.riderId || 0})" class="text-decoration-none">${ride.riderName || 'Unknown'}</a></td>
                <td><a href="#" onclick="adminInterface.showDriverProfile(${ride.driverId || 0})" class="text-decoration-none">${ride.driver?.name || 'No Driver'}</a></td>
                <td>${ride.pickupLocation}</td>
                <td>${ride.dropoffLocation}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(ride.status)}">${ride.status}</span>
                </td>
                <td>
                    <span class="badge ${this.getDriverLocationBadgeClass(ride.driverLocation)}">${ride.driverLocation}</span>
                </td>
                <td>$${ride.estimatedFare?.toFixed(2) || '0.00'}</td>
                <td>${this.formatDate(ride.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminInterface.editRide(${ride.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminInterface.deleteRide(${ride.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateRidesPagination(filteredRides.length);
    }

    updateRidesSummary() {
        const totalRides = this.rides.length;
        const completedRides = this.rides.filter(r => r.status === 'Completed').length;
        const inProgressRides = this.rides.filter(r => r.status === 'In Progress').length;
        const cancelledRides = this.rides.filter(r => r.status === 'Cancelled').length;

        const totalEl = document.getElementById('total-rides');
        const completedEl = document.getElementById('completed-rides');
        const inProgressEl = document.getElementById('in-progress-rides');
        const cancelledEl = document.getElementById('cancelled-rides');

        if (totalEl) totalEl.textContent = totalRides;
        if (completedEl) completedEl.textContent = completedRides;
        if (inProgressEl) inProgressEl.textContent = inProgressRides;
        if (cancelledEl) cancelledEl.textContent = cancelledRides;
    }

    // ===== UTILITY METHODS =====
    getStatusBadgeClass(status) {
        switch (status) {
            case 'Requested': return 'bg-warning';
            case 'In Progress': return 'bg-primary';
            case 'Completed': return 'bg-success';
            case 'Cancelled': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getDriverLocationBadgeClass(location) {
        switch (location) {
            case 'PreRide': return 'bg-secondary';
            case 'OnWay': return 'bg-info';
            case 'AtPickup': return 'bg-warning';
            case 'AtDropoff': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    updateRidesPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('rides-pagination');
        
        if (!paginationContainer) return;

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage.rides > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToRidesPage(${this.currentPage.rides - 1})">Previous</a></li>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage.rides ? 'active' : '';
            paginationHTML += `<li class="page-item ${isActive}"><a class="page-link" href="#" onclick="adminInterface.goToRidesPage(${i})">${i}</a></li>`;
        }
        
        // Next button
        if (this.currentPage.rides < totalPages) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToRidesPage(${this.currentPage.rides + 1})">Next</a></li>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    filterRides() {
        const statusFilter = document.getElementById('ride-status-filter')?.value || '';
        const driverFilter = document.getElementById('driver-filter')?.value || '';
        const riderFilter = document.getElementById('rider-filter')?.value || '';
        const searchFilter = document.getElementById('ride-search')?.value || '';

        this.filters.rides = {
            status: statusFilter,
            driver: driverFilter,
            rider: riderFilter,
            search: searchFilter
        };

        this.currentPage.rides = 1; // Reset to first page
        this.updateRidesTable();
    }

    goToRidesPage(page) {
        this.currentPage.rides = page;
        this.updateRidesTable();
    }

    // ===== RIDE CRUD METHODS =====
    showCreateRideModal() {
        // Populate rider and driver dropdowns
        const riderSelect = document.getElementById('create-ride-rider');
        const driverSelect = document.getElementById('create-ride-driver');
        
        if (riderSelect) {
            riderSelect.innerHTML = '<option value="">Select Rider</option>' +
                this.riders.map(rider => `<option value="${rider.id}">${rider.name}</option>`).join('');
        }
        
        if (driverSelect) {
            driverSelect.innerHTML = '<option value="">Select Driver (optional)</option>' +
                this.drivers.map(driver => `<option value="${driver.id}">${driver.name}</option>`).join('');
        }
        
        const modal = new bootstrap.Modal(document.getElementById('createRideModal'));
        modal.show();
    }

    async createRide() {
        const form = document.getElementById('create-ride-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const rideData = {
            riderId: parseInt(document.getElementById('create-ride-rider').value),
            driverId: document.getElementById('create-ride-driver').value ? parseInt(document.getElementById('create-ride-driver').value) : null,
            pickupLocation: document.getElementById('create-ride-pickup').value,
            dropoffLocation: document.getElementById('create-ride-dropoff').value,
            passengerCount: parseInt(document.getElementById('create-ride-passengers').value),
            cartSize: document.getElementById('create-ride-cart-size').value,
            estimatedFare: parseFloat(document.getElementById('create-ride-fare').value),
            status: document.getElementById('create-ride-status').value,
            driverLocation: document.getElementById('create-ride-driver-location').value,
            specialNotes: document.getElementById('create-ride-notes').value
        };

        try {
            await apiService.createRide(rideData);
            this.showNotification('Ride created successfully!', 'success');
            
            // Close modal and refresh data
            const modal = bootstrap.Modal.getInstance(document.getElementById('createRideModal'));
            modal.hide();
            
            await this.loadRides();
        } catch (error) {
            console.error('Error creating ride:', error);
            this.showNotification('Failed to create ride. Please try again.', 'danger');
        }
    }

    editRide(rideId) {
        this.showNotification('Edit ride functionality coming soon...', 'info');
    }

    deleteRide(rideId) {
        this.showNotification('Delete ride functionality coming soon...', 'info');
    }

    // ===== CAMPUS LOCATIONS MANAGEMENT =====
    async loadCampusLocations() {
        try {
            this.campusLocations = await apiService.getCampusLocations();
            this.updateLocationsTable();
            this.updateLocationsSummary();
        } catch (error) {
            console.error('Failed to load campus locations:', error);
            this.campusLocations = [];
            this.updateLocationsTable();
            this.showNotification('Failed to load campus locations.', 'warning');
        }
    }

    updateLocationsTable() {
        const tbody = document.getElementById('locations-table-body');
        if (!tbody) return;

        // Apply filters
        let filteredLocations = this.campusLocations;
        
        if (this.filters.locations.type) {
            filteredLocations = filteredLocations.filter(location => location.type === this.filters.locations.type);
        }
        
        if (this.filters.locations.search) {
            const searchTerm = this.filters.locations.search.toLowerCase();
            filteredLocations = filteredLocations.filter(location => 
                location.name.toLowerCase().includes(searchTerm)
            );
        }

        // Apply pagination
        const startIndex = (this.currentPage.locations - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        paginatedLocations.forEach(location => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${location.id}</td>
                <td>${location.name}</td>
                <td>
                    <span class="badge ${this.getLocationTypeBadgeClass(location.type)}">${location.type}</span>
                </td>
                <td>${location.latitude.toFixed(6)}</td>
                <td>${location.longitude.toFixed(6)}</td>
                <td>${this.formatDate(location.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="adminInterface.editLocation(${location.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminInterface.deleteLocation(${location.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateLocationsPagination(filteredLocations.length);
    }

    updateLocationsSummary() {
        const totalLocations = this.campusLocations.length;
        const academicLocations = this.campusLocations.filter(l => l.type === 'academic').length;
        const residentialLocations = this.campusLocations.filter(l => l.type === 'residential').length;
        const diningLocations = this.campusLocations.filter(l => l.type === 'dining').length;

        const totalEl = document.getElementById('total-locations');
        const academicEl = document.getElementById('academic-locations');
        const residentialEl = document.getElementById('residential-locations');
        const diningEl = document.getElementById('dining-locations');

        if (totalEl) totalEl.textContent = totalLocations;
        if (academicEl) academicEl.textContent = academicLocations;
        if (residentialEl) residentialEl.textContent = residentialLocations;
        if (diningEl) diningEl.textContent = diningLocations;
    }

    updateLocationsPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('locations-pagination');
        
        if (!paginationContainer) return;

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage.locations > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToLocationsPage(${this.currentPage.locations - 1})">Previous</a></li>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage.locations ? 'active' : '';
            paginationHTML += `<li class="page-item ${isActive}"><a class="page-link" href="#" onclick="adminInterface.goToLocationsPage(${i})">${i}</a></li>`;
        }
        
        // Next button
        if (this.currentPage.locations < totalPages) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToLocationsPage(${this.currentPage.locations + 1})">Next</a></li>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    goToLocationsPage(page) {
        this.currentPage.locations = page;
        this.updateLocationsTable();
    }

    filterLocations() {
        const typeFilter = document.getElementById('location-type-filter').value;
        const searchFilter = document.getElementById('location-search').value;

        this.filters.locations.type = typeFilter;
        this.filters.locations.search = searchFilter;
        this.currentPage.locations = 1;

        this.updateLocationsTable();
    }

    sortLocations() {
        const sortBy = document.getElementById('location-sort').value;
        
        this.campusLocations.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'type':
                    return a.type.localeCompare(b.type);
                case 'createdAt':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        this.updateLocationsTable();
    }

    showCreateLocationModal() {
        // Clear form
        document.getElementById('create-location-form').reset();
        
        const modal = new bootstrap.Modal(document.getElementById('createLocationModal'));
        modal.show();
    }

    async createLocation() {
        const name = document.getElementById('create-location-name').value;
        const latitude = parseFloat(document.getElementById('create-location-latitude').value);
        const longitude = parseFloat(document.getElementById('create-location-longitude').value);
        const type = document.getElementById('create-location-type').value;

        if (!name || isNaN(latitude) || isNaN(longitude) || !type) {
            this.showNotification('Please fill in all fields.', 'warning');
            return;
        }

        try {
            await apiService.createCampusLocation({
                name,
                latitude,
                longitude,
                type
            });

            this.showNotification('Campus location created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createLocationModal')).hide();
            await this.loadCampusLocations();
        } catch (error) {
            console.error('Error creating campus location:', error);
            this.showNotification('Failed to create campus location.', 'danger');
        }
    }

    async editLocation(locationId) {
        try {
            const location = await apiService.getCampusLocation(locationId);
            
            document.getElementById('edit-location-id').value = location.id;
            document.getElementById('edit-location-name').value = location.name;
            document.getElementById('edit-location-latitude').value = location.latitude;
            document.getElementById('edit-location-longitude').value = location.longitude;
            document.getElementById('edit-location-type').value = location.type;
            
            const modal = new bootstrap.Modal(document.getElementById('editLocationModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading location for edit:', error);
            this.showNotification('Failed to load location details.', 'danger');
        }
    }

    async updateLocation() {
        const id = document.getElementById('edit-location-id').value;
        const name = document.getElementById('edit-location-name').value;
        const latitude = parseFloat(document.getElementById('edit-location-latitude').value);
        const longitude = parseFloat(document.getElementById('edit-location-longitude').value);
        const type = document.getElementById('edit-location-type').value;

        if (!name || isNaN(latitude) || isNaN(longitude) || !type) {
            this.showNotification('Please fill in all fields.', 'warning');
            return;
        }

        try {
            await apiService.updateCampusLocation(id, {
                name,
                latitude,
                longitude,
                type
            });

            this.showNotification('Campus location updated successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editLocationModal')).hide();
            await this.loadCampusLocations();
        } catch (error) {
            console.error('Error updating campus location:', error);
            this.showNotification('Failed to update campus location.', 'danger');
        }
    }

    async deleteLocation(locationId) {
        if (!confirm('Are you sure you want to delete this campus location?')) {
            return;
        }

        try {
            await apiService.deleteCampusLocation(locationId);
            this.showNotification('Campus location deleted successfully!', 'success');
            await this.loadCampusLocations();
        } catch (error) {
            console.error('Error deleting campus location:', error);
            this.showNotification('Failed to delete campus location.', 'danger');
        }
    }

    getLocationTypeBadgeClass(type) {
        switch (type) {
            case 'academic': return 'bg-primary';
            case 'residential': return 'bg-success';
            case 'dining': return 'bg-warning';
            case 'recreation': return 'bg-info';
            case 'landmark': return 'bg-secondary';
            case 'hub': return 'bg-dark';
            default: return 'bg-light text-dark';
        }
    }

    updateRidesSummary() {
        const totalRides = this.rides.length;
        const completedRides = this.rides.filter(ride => ride.status === 'Completed').length;
        const inProgressRides = this.rides.filter(ride => ride.status === 'In Progress').length;
        const cancelledRides = this.rides.filter(ride => ride.status === 'Cancelled').length;

        document.getElementById('total-rides').textContent = totalRides;
        document.getElementById('completed-rides').textContent = completedRides;
        document.getElementById('in-progress-rides').textContent = inProgressRides;
        document.getElementById('cancelled-rides').textContent = cancelledRides;
    }

    populateRideFilters() {
        // Populate driver filter
        const driverFilter = document.getElementById('driver-filter');
        if (driverFilter) {
            driverFilter.innerHTML = '<option value="">All Drivers</option>' +
                this.drivers.map(driver => `<option value="${driver.id}">${driver.name}</option>`).join('');
        }

        // Populate rider filter
        const riderFilter = document.getElementById('rider-filter');
        if (riderFilter) {
            riderFilter.innerHTML = '<option value="">All Riders</option>' +
                this.riders.map(rider => `<option value="${rider.id}">${rider.name}</option>`).join('');
        }
    }

    // ===== PROFILE MODALS =====
    async showRiderProfile(riderId) {
        if (!riderId || riderId === 0) {
            this.showNotification('No rider information available.', 'warning');
            return;
        }

        try {
            const rider = await apiService.getRider(riderId);
            this.populateRiderProfileModal(rider);
            const modal = new bootstrap.Modal(document.getElementById('riderProfileModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading rider profile:', error);
            this.showNotification('Failed to load rider profile.', 'danger');
        }
    }

    async showDriverProfile(driverId) {
        if (!driverId || driverId === 0) {
            this.showNotification('No driver information available.', 'warning');
            return;
        }

        try {
            const driver = await apiService.getDriver(driverId);
            this.populateDriverProfileModal(driver);
            const modal = new bootstrap.Modal(document.getElementById('driverProfileModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading driver profile:', error);
            this.showNotification('Failed to load driver profile.', 'danger');
        }
    }

    // ===== PROFILE METHODS BY USER ID =====
    async showRiderProfileByUserId(userId) {
        try {
            console.log('showRiderProfileByUserId called with userId:', userId);
            console.log('Available users:', this.users);
            
            // Ensure we have the latest data
            if (this.riders.length === 0) {
                console.log('Riders array is empty, loading riders...');
                this.riders = await apiService.getRiders();
                console.log('Loaded riders:', this.riders);
            }
            
            // Find the user to get their RiderId
            const user = this.users.find(u => u.id === userId);
            console.log('Found user:', user);
            
            if (!user) {
                this.showNotification('User not found.', 'warning');
                return;
            }
            
            if (!user.riderId) {
                this.showNotification('No rider profile found for this user.', 'warning');
                return;
            }
            
            console.log('User riderId:', user.riderId);
            console.log('Available riders:', this.riders);
            
            // Find the rider using the RiderId
            const rider = this.riders.find(r => r.id === user.riderId);
            console.log('Found rider:', rider);
            
            if (!rider) {
                this.showNotification('No rider profile found for this user.', 'warning');
                return;
            }
            
            this.populateRiderProfileModal(rider);
            const modal = new bootstrap.Modal(document.getElementById('riderProfileModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading rider profile by user ID:', error);
            this.showNotification('Failed to load rider profile.', 'danger');
        }
    }

    async showDriverProfileByUserId(userId) {
        try {
            console.log('showDriverProfileByUserId called with userId:', userId);
            console.log('Available users:', this.users);
            
            // Ensure we have the latest data
            if (this.drivers.length === 0) {
                console.log('Drivers array is empty, loading drivers...');
                this.drivers = await apiService.getDrivers();
                console.log('Loaded drivers:', this.drivers);
            }
            
            // Find the user to get their DriverId
            const user = this.users.find(u => u.id === userId);
            console.log('Found user:', user);
            
            if (!user) {
                this.showNotification('User not found.', 'warning');
                return;
            }
            
            if (!user.driverId) {
                this.showNotification('No driver profile found for this user.', 'warning');
                return;
            }
            
            console.log('User driverId:', user.driverId);
            console.log('Available drivers:', this.drivers);
            
            // Find the driver using the DriverId
            const driver = this.drivers.find(d => d.id === user.driverId);
            console.log('Found driver:', driver);
            
            if (!driver) {
                this.showNotification('No driver profile found for this user.', 'warning');
                return;
            }
            
            this.populateDriverProfileModal(driver);
            const modal = new bootstrap.Modal(document.getElementById('driverProfileModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading driver profile by user ID:', error);
            this.showNotification('Failed to load driver profile.', 'danger');
        }
    }

    populateRiderProfileModal(rider) {
        document.getElementById('rider-profile-id').textContent = rider.id;
        document.getElementById('rider-profile-name').textContent = rider.name;
        document.getElementById('rider-profile-user-id').textContent = rider.userId || 'N/A';
        document.getElementById('rider-profile-total-rides').textContent = rider.totalRides || 0;
        document.getElementById('rider-profile-status').textContent = rider.riderStatus || 'Unknown';
        document.getElementById('rider-profile-rating').textContent = rider.averageRating ? rider.averageRating.toFixed(1) : 'N/A';
        document.getElementById('rider-profile-created').textContent = this.formatDate(rider.createdAt);
        document.getElementById('rider-profile-updated').textContent = this.formatDate(rider.updatedAt);
    }

    populateDriverProfileModal(driver) {
        document.getElementById('driver-profile-id').textContent = driver.id;
        document.getElementById('driver-profile-name').textContent = driver.name;
        document.getElementById('driver-profile-user-id').textContent = driver.userId || 'N/A';
        document.getElementById('driver-profile-vehicle-id').textContent = driver.vehicleId || 'N/A';
        document.getElementById('driver-profile-vehicle-name').textContent = driver.vehicleName || 'N/A';
        document.getElementById('driver-profile-location').textContent = driver.location || 'N/A';
        document.getElementById('driver-profile-status').textContent = driver.status || 'Unknown';
        document.getElementById('driver-profile-availability').textContent = driver.isAvailable ? 'Available' : 'Unavailable';
        document.getElementById('driver-profile-total-rides').textContent = driver.totalRides || 0;
        document.getElementById('driver-profile-average-tip').textContent = driver.averageTip ? `$${driver.averageTip.toFixed(2)}` : 'N/A';
        document.getElementById('driver-profile-rating').textContent = driver.rating ? driver.rating.toFixed(1) : 'N/A';
        document.getElementById('driver-profile-current-ride').textContent = driver.currentRideId || 'None';
        document.getElementById('driver-profile-created').textContent = this.formatDate(driver.createdAt);
        document.getElementById('driver-profile-updated').textContent = this.formatDate(driver.updatedAt);
    }

    updateMessagesTable() {
        const tbody = document.getElementById('messages-table-body');
        if (!tbody) return;

        // Apply filters
        let filteredMessages = this.messages;
        
        if (this.filters.messages.sender) {
            filteredMessages = filteredMessages.filter(msg => msg.sender === this.filters.messages.sender);
        }
        
        if (this.filters.messages.ride) {
            filteredMessages = filteredMessages.filter(msg => msg.rideId == this.filters.messages.ride);
        }
        
        if (this.filters.messages.date) {
            const filterDate = new Date(this.filters.messages.date);
            filteredMessages = filteredMessages.filter(msg => {
                const msgDate = new Date(msg.createdAt);
                return msgDate.toDateString() === filterDate.toDateString();
            });
        }
        
        if (this.filters.messages.search) {
            const searchTerm = this.filters.messages.search.toLowerCase();
            filteredMessages = filteredMessages.filter(msg => {
                // Get the actual name for search
                let actualName = 'Unknown';
                if (msg.sender === 'driver' && msg.driverId) {
                    const driver = this.drivers.find(d => d.id === msg.driverId);
                    actualName = driver ? driver.name : 'Unknown Driver';
                } else if (msg.sender === 'rider') {
                    // For rider messages, try to get name from riderId first, then from ride data
                    if (msg.riderId) {
                        const rider = this.riders.find(r => r.id === msg.riderId);
                        actualName = rider ? rider.name : 'Unknown Rider';
                    } else {
                        // If riderId is null, get rider name from the ride data
                        const ride = this.rides.find(r => r.id === msg.rideId);
                        actualName = ride ? ride.riderName : 'Unknown Rider';
                    }
                }
                
                return msg.content.toLowerCase().includes(searchTerm) ||
                       actualName.toLowerCase().includes(searchTerm);
            });
        }

        // Apply pagination
        const startIndex = (this.currentPage.messages - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        paginatedMessages.forEach(message => {
            // Get the actual name based on sender type
            let actualName = 'Unknown';
            if (message.sender === 'driver' && message.driverId) {
                const driver = this.drivers.find(d => d.id === message.driverId);
                actualName = driver ? driver.name : 'Unknown Driver';
            } else if (message.sender === 'rider') {
                // For rider messages, try to get name from riderId first, then from ride data
                if (message.riderId) {
                    const rider = this.riders.find(r => r.id === message.riderId);
                    actualName = rider ? rider.name : 'Unknown Rider';
                } else {
                    // If riderId is null, get rider name from the ride data
                    const ride = this.rides.find(r => r.id === message.rideId);
                    actualName = ride ? ride.riderName : 'Unknown Rider';
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${message.id}</td>
                <td>${message.rideId}</td>
                <td>
                    <span class="badge ${message.sender === 'driver' ? 'bg-primary' : 'bg-success'}">${message.sender}</span>
                </td>
                <td>${actualName}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${message.content}">${message.content}</td>
                <td>${this.formatDate(message.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminInterface.deleteMessage(${message.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateMessagesPagination(filteredMessages.length);
    }

    updateMessagesSummary() {
        const totalMessages = this.messages.length;
        const driverMessages = this.messages.filter(msg => msg.sender === 'driver').length;
        const riderMessages = this.messages.filter(msg => msg.sender === 'rider').length;

        document.getElementById('total-messages').textContent = totalMessages;
        document.getElementById('driver-messages').textContent = driverMessages;
        document.getElementById('rider-messages').textContent = riderMessages;
    }

    populateMessageFilters() {
        // Populate ride filter
        const rideFilter = document.getElementById('message-ride-filter');
        if (rideFilter) {
            const uniqueRideIds = [...new Set(this.messages.map(msg => msg.rideId))].sort((a, b) => a - b);
            rideFilter.innerHTML = '<option value="">All Rides</option>' +
                uniqueRideIds.map(rideId => `<option value="${rideId}">Ride ${rideId}</option>`).join('');
        }
    }

    updateAnalyticsSummary() {
        const totalUsers = this.users.length;
        const activeDrivers = this.users.filter(u => u.role === 'Driver' && u.isActive).length;
        
        const totalEarnings = this.rides
            .filter(r => r.status === 'Completed')
            .reduce((sum, ride) => sum + (ride.estimatedFare || 0), 0);
        
        const completedRides = this.rides.filter(r => r.status === 'Completed');
        const avgRideFare = completedRides.length > 0 ? totalEarnings / completedRides.length : 0;

        const totalUsersEl = document.getElementById('total-users-analytics');
        const activeDriversEl = document.getElementById('active-drivers-analytics');
        const totalEarningsEl = document.getElementById('total-earnings-analytics');
        const avgRideFareEl = document.getElementById('avg-ride-fare-analytics');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (activeDriversEl) activeDriversEl.textContent = activeDrivers;
        if (totalEarningsEl) totalEarningsEl.textContent = `$${totalEarnings.toFixed(2)}`;
        if (avgRideFareEl) avgRideFareEl.textContent = `$${avgRideFare.toFixed(2)}`;
    }

    // ===== MESSAGE FILTERING AND PAGINATION =====
    filterMessages() {
        const senderFilter = document.getElementById('sender-filter')?.value || '';
        const rideFilter = document.getElementById('message-ride-filter')?.value || '';
        const dateFilter = document.getElementById('message-date-filter')?.value || '';
        const searchFilter = document.getElementById('message-search')?.value || '';

        this.filters.messages = {
            sender: senderFilter,
            ride: rideFilter,
            date: dateFilter,
            search: searchFilter
        };

        this.currentPage.messages = 1; // Reset to first page
        this.updateMessagesTable();
    }

    updateMessagesPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('messages-pagination');
        
        if (!paginationContainer) return;

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage.messages > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToMessagesPage(${this.currentPage.messages - 1})">Previous</a></li>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage.messages ? 'active' : '';
            paginationHTML += `<li class="page-item ${isActive}"><a class="page-link" href="#" onclick="adminInterface.goToMessagesPage(${i})">${i}</a></li>`;
        }
        
        // Next button
        if (this.currentPage.messages < totalPages) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="adminInterface.goToMessagesPage(${this.currentPage.messages + 1})">Next</a></li>`;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    goToMessagesPage(page) {
        this.currentPage.messages = page;
        this.updateMessagesTable();
    }

    deleteMessage(messageId) {
        if (confirm('Are you sure you want to delete this message?')) {
            this.showNotification('Delete message functionality coming soon...', 'info');
        }
    }

    clearAllMessages() {
        if (confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
            this.showNotification('Clear all messages functionality coming soon...', 'info');
        }
    }

    updateCharts() {
        this.updateRidesStatusChart();
        this.updateUsersRoleChart();
    }

    updateRidesStatusChart() {
        const ctx = document.getElementById('ridesStatusChart');
        if (!ctx) return;

        // Count rides by status
        const statusCounts = {};
        this.rides.forEach(ride => {
            statusCounts[ride.status] = (statusCounts[ride.status] || 0) + 1;
        });

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        const colors = {
            'Requested': '#ffc107',
            'In Progress': '#0d6efd',
            'Completed': '#198754',
            'Cancelled': '#dc3545'
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: labels.map(label => colors[label] || '#6c757d'),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateUsersRoleChart() {
        const ctx = document.getElementById('usersRoleChart');
        if (!ctx) return;

        // Count users by role
        const roleCounts = {};
        this.users.forEach(user => {
            roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
        });

        const labels = Object.keys(roleCounts);
        const data = Object.values(roleCounts);
        const colors = {
            'Admin': '#dc3545',
            'Driver': '#0d6efd',
            'Rider': '#198754'
        };

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: labels.map(label => colors[label] || '#6c757d'),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Initialize admin interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminInterface = new AdminInterface();
});