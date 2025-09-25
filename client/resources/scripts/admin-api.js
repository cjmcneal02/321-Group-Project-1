// Admin Interface for User Management
class AdminInterface {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (apiService.currentUserId && apiService.currentUserRole === 'Admin') {
            this.showDashboard();
            this.loadUsers();
        } else {
            this.showLogin();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // No form submission needed - using button onclick
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
            
            apiService.currentUserId = this.currentUser.id;
            apiService.currentUserRole = this.currentUser.role;
            
            this.showDashboard();
            await this.loadUsers();
            this.showNotification('Login successful!', 'success');
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'danger');
        }
    }

    logout() {
        apiService.logout();
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Logged out successfully.', 'info');
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
            this.updateSummary();
        } catch (error) {
            this.showNotification('Failed to load users.', 'danger');
        }
    }

    updateUsersTable() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span>
                </td>
                <td>
                    <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
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
    }

    getRoleBadgeClass(role) {
        switch (role) {
            case 'Admin': return 'bg-danger';
            case 'Driver': return 'bg-primary';
            case 'Rider': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    updateSummary() {
        const totalUsers = this.users.length;
        const activeDrivers = this.users.filter(u => u.role === 'Driver' && u.isActive).length;
        const activeRiders = this.users.filter(u => u.role === 'Rider' && u.isActive).length;
        const admins = this.users.filter(u => u.role === 'Admin' && u.isActive).length;

        document.getElementById('summary-users').textContent = totalUsers;
        document.getElementById('summary-drivers').textContent = activeDrivers;
        document.getElementById('summary-riders').textContent = activeRiders;
        document.getElementById('summary-admins').textContent = admins;
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
            password: document.getElementById('create-password').value,
            role: document.getElementById('create-role').value,
            firstName: document.getElementById('create-firstname').value,
            lastName: document.getElementById('create-lastname').value,
            phoneNumber: document.getElementById('create-phone').value
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
        document.getElementById('edit-phone').value = user.phoneNumber;
        document.getElementById('edit-role').value = user.role;
        document.getElementById('edit-active').checked = user.isActive;

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
            phoneNumber: document.getElementById('edit-phone').value,
            role: document.getElementById('edit-role').value,
            isActive: document.getElementById('edit-active').checked
        };

        // Only include password if provided
        const password = document.getElementById('edit-password').value;
        if (password) {
            userData.password = password;
        }

        try {
            await apiService.updateUser(userId, userData);
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
}

// Initialize admin interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminInterface = new AdminInterface();
});