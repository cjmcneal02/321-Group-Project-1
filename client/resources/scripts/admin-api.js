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
                apiService.getRideHistory(),
                apiService.getRiders(),
                apiService.getDrivers()
            ]);
            
            this.rides = rides;
            this.riders = riders;
            this.drivers = drivers;
            
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
            // For admin, we need to get all messages, not just for a specific ride
            // This would need a new API endpoint like GET /api/chatmessages/all
            // For now, let's skip this and show placeholder
            this.messages = [];
            this.updateMessagesTable();
            this.updateMessagesSummary();
            this.populateMessageFilters();
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.messages = [];
            this.updateMessagesTable();
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
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.firstName} ${user.lastName}</td>
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

    goToRidesPage(page) {
        this.currentPage.rides = page;
        this.updateRidesTable();
    }

    // ===== PLACEHOLDER METHODS FOR FUTURE IMPLEMENTATION =====
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
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Messages functionality coming soon...</td></tr>';
    }

    updateMessagesSummary() {
        // Placeholder
    }

    populateMessageFilters() {
        // Placeholder
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

    updateCharts() {
        // Placeholder
    }
}

// Initialize admin interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminInterface = new AdminInterface();
});