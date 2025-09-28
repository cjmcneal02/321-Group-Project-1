/**
 * Driver Interface Module for Tide Rides - API Version
 * Uses RESTful API calls instead of AppState
 */

class DriverInterface {
    constructor() {
        // Check for API service availability
        if (typeof apiService === 'undefined') {
            console.error('ApiService not available. Please ensure api-service.js is loaded.');
            return;
        }

        this.currentDriverId = null;
        this.currentUser = null;
        this.currentRide = null;
        this.requestsPollingInterval = null;
        this.chatPollingInterval = null;
        this.currentRideId = null;
        this.rideButtonsInitialized = false;

        this.init();
    }

    async init() {
        // Load available drivers for login dropdown
        await this.loadAvailableDrivers();
        
        // Set up toggle status button
        this.setupToggleStatusButton();
        
        // Check if user is already logged in as a driver from localStorage
        const savedDriverId = localStorage.getItem('driverId');
        const savedDriverRole = localStorage.getItem('driverRole');
        
        if (savedDriverId && savedDriverRole === 'Driver') {
            // Restore driver session
            this.currentDriverId = parseInt(savedDriverId);
            apiService.currentDriverId = this.currentDriverId;
            apiService.currentUserId = parseInt(localStorage.getItem('driverUserId'));
            apiService.currentUserRole = 'Driver';
            
            this.showDashboard();
            this.loadDriverData();
        } else {
            this.showLogin();
        }
    }

    setupToggleStatusButton() {
        const toggleStatusBtn = document.getElementById('toggleStatusBtn');
        if (toggleStatusBtn) {
            toggleStatusBtn.addEventListener('click', () => this.toggleDriverStatus());
        }
    }

    async loadAvailableDrivers() {
        try {
            const drivers = await apiService.getDrivers();
            const driverSelect = document.getElementById('driver-select');
            
            if (driverSelect && drivers) {
                // Clear existing options except the first one
                driverSelect.innerHTML = '<option value="">Select a driver...</option>';
                
                // Add driver options
                drivers.forEach(driver => {
                    const option = document.createElement('option');
                    option.value = driver.id || driver.Id;
                    option.textContent = driver.name || driver.Name;
                    driverSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
            this.showNotification('Failed to load driver accounts.', 'danger');
        }
    }

    async loadDriverUsers() {
        try {
            const driverUsers = await apiService.getUsersByRole('Driver');
            const select = document.getElementById('driver-select');
            select.innerHTML = '<option value="">Select a driver...</option>';
            
            driverUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = `${user.firstName} ${user.lastName} (${user.username})`;
                select.appendChild(option);
            });
        } catch (error) {
            this.showNotification('Failed to load driver accounts.', 'danger');
        }
    }

    async loginDriver() {
        const selectedDriver = document.getElementById('driver-select').value;

        if (!selectedDriver) {
            this.showNotification('Please select a driver account.', 'warning');
            return;
        }

        try {
            // Get driver data from API instead of hardcoded values
            const driverId = parseInt(selectedDriver);
            const driver = await apiService.getDriver(driverId);
            
            if (!driver) {
                this.showNotification('Driver not found.', 'error');
                return;
            }

            // Set up user data from API response
            const userData = {
                id: driver.userId || driver.UserId || driverId,
                username: (driver.name || driver.Name || '').toLowerCase().replace(' ', ''),
                role: 'Driver',
                firstName: (driver.name || driver.Name || '').split(' ')[0],
                lastName: (driver.name || driver.Name || '').split(' ')[1] || ''
            };

            this.currentUser = userData;
            this.currentDriverId = driverId;
            
            apiService.currentUserId = userData.id;
            apiService.currentUserRole = userData.role;
            apiService.currentDriverId = driverId;

            // Save driver session to localStorage
            localStorage.setItem('driverId', driverId.toString());
            localStorage.setItem('driverRole', 'Driver');
            localStorage.setItem('driverUserId', userData.id.toString());

            this.showDashboard();
            this.loadDriverData();
            
            this.showNotification(`Welcome, ${userData.firstName}!`, 'success');
        } catch (error) {
            console.error('Error logging in driver:', error);
            this.showNotification('Login failed. Please try again.', 'danger');
        }
    }

    logout() {
        apiService.logout();
        this.currentUser = null;
        this.currentDriverId = null;
        
        // Clear driver session from localStorage
        localStorage.removeItem('driverId');
        localStorage.removeItem('driverRole');
        localStorage.removeItem('driverUserId');
        
        this.showLogin();
        this.showNotification('Logged out successfully.', 'info');
    }

    showLogin() {
        document.getElementById('driver-selection-section').style.display = 'block';
        document.getElementById('driver-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('driver-selection-section').style.display = 'none';
        document.getElementById('driver-dashboard').style.display = 'block';
    }

    loadDriverData() {
        this.updateDriverInfo();
        this.startRequestsPolling();
        this.loadRideHistory();
        this.checkForActiveRide();
        
        // Always show active ride panel
        this.showActiveRidePanel();
        this.initializeChat();
        this.initializeRideButtons();
    }

    /**
     * Check for active ride when driver logs in
     */
    async checkForActiveRide() {
        try {
            const activeRides = await apiService.getRidesByStatus('In Progress');
            const driverActiveRide = activeRides.find(ride => 
                (ride.DriverId || ride.driverId) === this.currentDriverId
            );
            
            if (driverActiveRide) {
                this.currentRide = driverActiveRide;
                this.currentRideId = driverActiveRide.Id || driverActiveRide.id;
                this.showActiveRideUI(driverActiveRide);
                this.hideRequestsUI();
            }
        } catch (error) {
            console.error('Error checking for active ride:', error);
        }
    }

    /**
     * Initialize the driver interface
     */
    initializeInterface() {
        this.setupEventListeners();
        this.updateDriverInfo();
        this.startRequestsPolling();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh requests button
        const refreshBtn = document.getElementById('refreshRequestsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshRequests());
        }

        // Driver status toggle
        const statusToggle = document.getElementById('driver-status-toggle');
        if (statusToggle) {
            statusToggle.addEventListener('change', (e) => this.updateDriverStatus(e.target.checked));
        }
    }

    /**
     * Update driver information display
     */
    async updateDriverInfo() {
        try {
            const driver = await apiService.getDriver(this.currentDriverId);
            if (driver) {
                this.updateDriverDisplay(driver);
            }
        } catch (error) {
            console.error('Error updating driver info:', error);
        }
    }

    /**
     * Update driver display
     */
    updateDriverDisplay(driver) {
        // Update welcome message
        const welcomeMessageElement = document.getElementById('welcomeMessage');
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = driver.name || driver.Name || 'Unknown Driver';
        }

        // Update vehicle info
        const vehicleInfoElement = document.getElementById('vehicleInfo');
        if (vehicleInfoElement) {
            const vehicleName = driver.vehicleName || driver.VehicleName || 'Unknown Vehicle';
            const vehicleId = driver.vehicleId || driver.VehicleId || 'Unknown ID';
            vehicleInfoElement.textContent = `${vehicleName} #${vehicleId}`;
        }

        // Update status badge
        const statusBadgeElement = document.getElementById('statusBadge');
        if (statusBadgeElement) {
            const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            const statusText = isAvailable ? 'Available' : 'Unavailable';
            const statusClass = isAvailable ? 'bg-success' : 'bg-danger';
            const statusIcon = isAvailable ? 'bi-check-circle' : 'bi-x-circle';
            statusBadgeElement.innerHTML = `<i class="bi ${statusIcon} me-1"></i>${statusText}`;
            statusBadgeElement.className = `badge ${statusClass} fs-6 mb-2`;
        }

        // Update status text
        const statusTextElement = document.getElementById('statusText');
        if (statusTextElement) {
            const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            statusTextElement.textContent = isAvailable ? 'Available' : 'Unavailable';
        }

        // Update status indicator circle
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            const icon = statusIndicator.querySelector('i');
            if (icon) {
                const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
                icon.className = isAvailable ? 'bi bi-circle-fill text-success fs-1' : 'bi bi-circle-fill text-danger fs-1';
            }
        }

        // Update status subtext
        const statusSubtext = document.getElementById('statusSubtext');
        if (statusSubtext) {
            const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            statusSubtext.textContent = isAvailable ? 'Ready to accept rides' : 'Not accepting rides';
        }

        // Update toggle button
        const toggleStatusBtn = document.getElementById('toggleStatusBtn');
        if (toggleStatusBtn) {
            const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            if (isAvailable) {
                toggleStatusBtn.innerHTML = '<i class="bi bi-power me-2"></i>Go Unavailable';
                toggleStatusBtn.className = 'btn btn-outline-danger';
            } else {
                toggleStatusBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Go Available';
                toggleStatusBtn.className = 'btn btn-outline-success';
            }
        }

        const driverNameElement = document.querySelector('.driver-name');
        if (driverNameElement) {
            driverNameElement.textContent = driver.name || driver.Name || 'Unknown Driver';
        }

        const driverStatusElement = document.querySelector('.driver-status');
        if (driverStatusElement) {
            const status = driver.status || driver.Status || 'Unknown';
            const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            driverStatusElement.textContent = status;
            driverStatusElement.className = `driver-status badge ${isAvailable ? 'bg-success' : 'bg-danger'}`;
        }

        const ratingElement = document.querySelector('.driver-rating');
        if (ratingElement) {
            const rating = driver.rating || driver.Rating || 0;
            ratingElement.textContent = rating.toFixed(1);
        }

        const totalRidesElement = document.querySelector('.total-rides');
        if (totalRidesElement) {
            totalRidesElement.textContent = driver.totalRides || driver.TotalRides || 0;
        }
    }

    /**
     * Start polling for ride requests
     */
    startRequestsPolling() {
        this.requestsPollingInterval = setInterval(async () => {
            try {
                await this.updateRequestsUI();
            } catch (error) {
                console.error('Error updating requests UI:', error);
            }
        }, 1000); // Poll every second

        // Initial update
        this.updateRequestsUI();
    }

    /**
     * Stop requests polling
     */
    stopRequestsPolling() {
        if (this.requestsPollingInterval) {
            clearInterval(this.requestsPollingInterval);
            this.requestsPollingInterval = null;
        }
    }

    /**
     * Update requests UI
     */
    async updateRequestsUI() {
        try {
            const requests = await apiService.getRidesByStatus('Requested');
            const requestsList = document.getElementById('requestsList');
            
            if (!requestsList) {
                console.error('Driver: requestsList element not found');
                return;
            }

            // Clear existing requests
            requestsList.innerHTML = '';

            if (requests.length === 0) {
                // Show no requests state
                const noRequestsState = document.getElementById('noRequestsState');
                if (noRequestsState) {
                    noRequestsState.classList.remove('d-none');
                }
                requestsList.classList.add('d-none');
                return;
            }

            // Hide no requests state and show requests list
            const noRequestsState = document.getElementById('noRequestsState');
            if (noRequestsState) {
                noRequestsState.classList.add('d-none');
            }
            requestsList.classList.remove('d-none');

            // Remove duplicates based on ID
            const uniqueRequests = requests.filter((request, index, self) => {
                const requestId = request.Id || request.id;
                return index === self.findIndex(r => (r.Id || r.id) === requestId);
            });

            // Display requests
            uniqueRequests.forEach(request => {
                const requestElement = this.createRequestElement(request);
                requestsList.appendChild(requestElement);
            });

        } catch (error) {
            console.error('Error updating requests UI:', error);
        }
    }

    /**
     * Create request element
     */
    createRequestElement(request) {
        const requestDiv = document.createElement('div');
        requestDiv.className = 'request-item border rounded p-3 mb-3';
        const riderName = request.RiderName || request.riderName;
        const estimatedFare = request.EstimatedFare || request.estimatedFare;
        const pickupLocation = request.PickupLocation || request.pickupLocation;
        const dropoffLocation = request.DropoffLocation || request.dropoffLocation;
        const passengerCount = request.PassengerCount || request.passengerCount;
        const cartSize = request.CartSize || request.cartSize;
        const rideId = request.Id || request.id;

        requestDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0">${riderName}</h6>
                <span class="badge bg-primary">$${(estimatedFare || 5.00).toFixed(2)}</span>
            </div>
            <div class="request-details mb-3">
                <div class="row">
                    <div class="col-6">
                        <small class="text-muted">From:</small><br>
                        <strong>${pickupLocation}</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">To:</small><br>
                        <strong>${dropoffLocation}</strong>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-6">
                        <small class="text-muted">Passengers:</small><br>
                        <span>${passengerCount}</span>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Cart Size:</small><br>
                        <span>${cartSize}</span>
                    </div>
                </div>
            </div>
            <div class="request-actions">
                <button class="btn btn-success btn-sm me-2" onclick="driverInterface.acceptRequest(${rideId})">
                    <i class="bi bi-check-circle me-1"></i>Accept
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="driverInterface.declineRequest(${rideId})">
                    <i class="bi bi-x-circle me-1"></i>Decline
                </button>
            </div>
        `;

        return requestDiv;
    }

    /**
     * Accept ride request
     */
    async acceptRequest(rideId) {
        try {
            
            const ride = await apiService.acceptRide(rideId, this.currentDriverId);
            
            if (ride) {
                this.currentRide = ride;
                this.currentRideId = ride.Id || ride.id;
                
                // Hide requests and show active ride
                this.hideRequestsUI();
                this.showActiveRideUI(ride);
                this.showChatInterface(ride.Id || ride.id);
                
                this.showNotification('Ride accepted! Chat with your rider.', 'success');
            }

        } catch (error) {
            console.error('Error accepting request:', error);
            this.showNotification('Failed to accept ride request.', 'danger');
        }
    }

    /**
     * Decline ride request
     */
    async declineRequest(rideId) {
        try {
            await apiService.cancelRide(rideId);
            this.showNotification('Ride request declined.', 'info');
        } catch (error) {
            console.error('Error declining request:', error);
            this.showNotification('Failed to decline ride request.', 'danger');
        }
    }

    /**
     * Show active ride UI
     */
    showActiveRideUI(ride) {
        // Update the hardcoded HTML elements with dynamic data
        this.updateActiveRideDetails(ride);
        
        // Show active ride state, hide no ride state
        const activeRideState = document.getElementById('activeRideState');
        const noRideState = document.getElementById('noRideState');
        
        if (activeRideState) {
            activeRideState.classList.remove('d-none');
        }
        if (noRideState) {
            noRideState.classList.add('d-none');
        }
        
        // Load chat messages
        this.loadChatMessages();
        
        // Hide requests UI
        this.hideRequestsUI();
    }

    /**
     * Update the hardcoded ride details with dynamic data
     */
    updateActiveRideDetails(ride) {
        // Handle both camelCase and PascalCase property names
        const riderName = ride.RiderName || ride.riderName || 'Unknown Rider';
        const estimatedFare = ride.EstimatedFare || ride.estimatedFare || 0;
        const pickupLocation = ride.PickupLocation || ride.pickupLocation || 'Unknown';
        const dropoffLocation = ride.DropoffLocation || ride.dropoffLocation || 'Unknown';
        const passengerCount = ride.PassengerCount || ride.passengerCount || 1;
        const cartSize = ride.CartSize || ride.cartSize || 'Standard';
        const specialNotes = ride.SpecialNotes || ride.specialNotes || '';
        
        // Update the hardcoded HTML elements
        const passengerNameElement = document.getElementById('passengerName');
        if (passengerNameElement) {
            passengerNameElement.textContent = riderName;
        }

        const pickupLocationElement = document.getElementById('pickupLocation');
        if (pickupLocationElement) {
            pickupLocationElement.textContent = pickupLocation;
        }

        const dropoffLocationElement = document.getElementById('dropoffLocation');
        if (dropoffLocationElement) {
            dropoffLocationElement.textContent = dropoffLocation;
        }

        const passengerCountElement = document.getElementById('passengerCount');
        if (passengerCountElement) {
            passengerCountElement.textContent = passengerCount;
        }

        const cartSizeElement = document.getElementById('cartSize');
        if (cartSizeElement) {
            cartSizeElement.textContent = cartSize;
        }

        const rideFareElement = document.getElementById('rideFare');
        if (rideFareElement) {
            rideFareElement.textContent = `$${estimatedFare.toFixed(2)}`;
        }

        const specialNotesElement = document.getElementById('specialNotesContent');
        if (specialNotesElement) {
            if (specialNotes && specialNotes.trim()) {
                specialNotesElement.innerHTML = `<em>${specialNotes}</em>`;
            } else {
                specialNotesElement.innerHTML = '<em>No special notes</em>';
            }
        }
    }

    /**
     * Hide requests UI
     */
    hideRequestsUI() {
        const requestsSection = document.getElementById('requests-section');
        if (requestsSection) {
            requestsSection.style.display = 'none';
        }
    }

    /**
     * Show requests UI
     */
    showRequestsUI() {
        const requestsSection = document.getElementById('requests-section');
        if (requestsSection) {
            requestsSection.style.display = 'block';
        }
    }

    /**
     * Complete ride
     */
    async completeRide() {
        try {
            if (!this.currentRide) {
                this.showNotification('No active ride to complete.', 'warning');
                return;
            }

            // Call POST /api/drivers/{id}/complete-ride with { rideId }
            const completeData = {
                RideId: this.currentRide.Id || this.currentRide.id
            };
            
            const result = await apiService.completeRide(this.currentDriverId, completeData);
            
            if (result) {
                // Send completion message to rider
                await apiService.sendChatMessage(
                    this.currentRide.Id || this.currentRide.id,
                    'driver',
                    'Stacy Streets',
                    'Ride completed! Please confirm completion.'
                );

                this.showNotification('Ride completed successfully!', 'success');
                
                // Reset UI
                this.hideActiveRideUI();
                this.hideChatInterface();
                this.showRequestsUI();
                
                // Refresh ride history to show the completed ride
                await this.loadRideHistory();
                
                // Clear current ride
                this.currentRide = null;
                this.currentRideId = null;
            }

        } catch (error) {
            console.error('Error completing ride:', error);
            this.showNotification('Failed to complete ride.', 'danger');
        }
    }

    /**
     * Hide active ride UI
     */
    hideActiveRideUI() {
        const activeRideSection = document.getElementById('active-ride-section');
        if (activeRideSection) {
            activeRideSection.style.display = 'none';
        }
    }

    /**
     * Show chat interface
     */
    showChatInterface(rideId) {
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
            chatSection.style.display = 'block';
            chatSection.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Chat with Rider</h5>
                    </div>
                    <div class="card-body">
                        <div id="chat-messages" class="chat-messages mb-3" style="height: 300px; overflow-y: auto; border: 1px solid #dee2e6; padding: 1rem;">
                            <!-- Messages will be loaded here -->
                        </div>
                        <div class="quick-messages mb-3">
                            <h6>Quick Messages:</h6>
                            <div class="btn-group-vertical w-100" role="group">
                                <button class="btn btn-outline-primary btn-sm mb-1" onclick="driverInterface.sendQuickMessage(${rideId}, 'On my way!')">
                                    On my way!
                                </button>
                                <button class="btn btn-outline-primary btn-sm mb-1" onclick="driverInterface.sendQuickMessage(${rideId}, '2 minutes away')">
                                    2 minutes away
                                </button>
                                <button class="btn btn-outline-primary btn-sm mb-1" onclick="driverInterface.sendQuickMessage(${rideId}, 'I\'m here!')">
                                    I'm here!
                                </button>
                                <button class="btn btn-outline-primary btn-sm mb-1" onclick="driverInterface.sendQuickMessage(${rideId}, 'Please come outside')">
                                    Please come outside
                                </button>
                            </div>
                        </div>
                        <div class="input-group">
                            <input type="text" id="driver-message-input" class="form-control" placeholder="Type your message...">
                            <button class="btn btn-primary" onclick="driverInterface.sendDriverMessage(${rideId})">
                                <i class="bi bi-send"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Load existing messages
            this.loadDriverChatMessages(rideId);
            
            // Start chat polling
            this.startDriverChatPolling(rideId);
        }
    }

    /**
     * Hide chat interface
     */
    hideChatInterface() {
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
            chatSection.style.display = 'none';
        }
        
        // Stop chat polling
        this.stopDriverChatPolling();
    }

    /**
     * Send quick message
     */
    async sendQuickMessage(rideId, message) {
        try {
            await apiService.sendChatMessage(rideId, 'driver', 'Stacy Streets', message);
        } catch (error) {
            console.error('Error sending quick message:', error);
            this.showNotification('Failed to send message.', 'danger');
        }
    }

    /**
     * Send driver message
     */
    async sendDriverMessage(rideId) {
        try {
            const messageInput = document.getElementById('driver-message-input');
            const message = messageInput.value.trim();
            
            if (!message) return;

            await apiService.sendChatMessage(rideId, 'driver', 'Stacy Streets', message);
            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message.', 'danger');
        }
    }

    /**
     * Load driver chat messages
     */
    async loadDriverChatMessages(rideId) {
        try {
            const messages = await apiService.getChatMessages(rideId);
            const messagesContainer = document.getElementById('chat-messages');
            
            if (messagesContainer) {
                messagesContainer.innerHTML = messages.map(message => `
                    <div class="message ${message.Sender === 'driver' ? 'message-driver' : 'message-rider'} mb-2">
                        <div class="message-content p-2 rounded">
                            <strong>${message.SenderName}:</strong> ${message.Content}
                            <small class="text-muted d-block">${new Date(message.CreatedAt).toLocaleTimeString()}</small>
                        </div>
                    </div>
                `).join('');
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    }

    /**
     * Start driver chat polling
     */
    startDriverChatPolling(rideId) {
        this.chatPollingInterval = setInterval(async () => {
            try {
                await this.loadDriverChatMessages(rideId);
            } catch (error) {
                console.error('Error polling chat messages:', error);
            }
        }, 2000); // Poll every 2 seconds
    }

    /**
     * Stop driver chat polling
     */
    stopDriverChatPolling() {
        if (this.chatPollingInterval) {
            clearInterval(this.chatPollingInterval);
            this.chatPollingInterval = null;
        }
    }

    /**
     * Toggle driver status between available and unavailable
     */
    async toggleDriverStatus() {
        if (!this.currentDriverId) {
            this.showNotification('Please log in first.', 'warning');
            return;
        }

        try {
            // Get current driver status
            const driver = await apiService.getDriver(this.currentDriverId);
            const currentStatus = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
            
            // Toggle the status
            const newStatus = !currentStatus;
            await this.updateDriverStatus(newStatus);
            
            // Update button text and UI
            this.updateToggleButton(newStatus);
            
        } catch (error) {
            console.error('Error toggling driver status:', error);
            this.showNotification('Failed to toggle status.', 'danger');
        }
    }

    /**
     * Update toggle button appearance
     */
    updateToggleButton(isAvailable) {
        const toggleStatusBtn = document.getElementById('toggleStatusBtn');
        if (toggleStatusBtn) {
            if (isAvailable) {
                toggleStatusBtn.innerHTML = '<i class="bi bi-power me-2"></i>Go Unavailable';
                toggleStatusBtn.className = 'btn btn-outline-danger';
            } else {
                toggleStatusBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Go Available';
                toggleStatusBtn.className = 'btn btn-outline-success';
            }
        }

        // Update status badge
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
            if (isAvailable) {
                statusBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i>Available';
                statusBadge.className = 'badge bg-success fs-6 mb-2';
            } else {
                statusBadge.innerHTML = '<i class="bi bi-x-circle me-1"></i>Unavailable';
                statusBadge.className = 'badge bg-danger fs-6 mb-2';
            }
        }

        // Update status text
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = isAvailable ? 'Available' : 'Unavailable';
        }

        // Update status indicator circle
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            const icon = statusIndicator.querySelector('i');
            if (icon) {
                icon.className = isAvailable ? 'bi bi-circle-fill text-success fs-1' : 'bi bi-circle-fill text-danger fs-1';
            }
        }

        // Update status subtext
        const statusSubtext = document.getElementById('statusSubtext');
        if (statusSubtext) {
            statusSubtext.textContent = isAvailable ? 'Ready to accept rides' : 'Not accepting rides';
        }
    }

    /**
     * Always show active ride panel
     */
    showActiveRidePanel() {
        const activeRidePanel = document.querySelector('.col-lg-8');
        if (activeRidePanel) {
            activeRidePanel.style.display = 'block';
        }
    }

    /**
     * Initialize chat functionality
     */
    initializeChat() {
        const sendBtn = document.getElementById('send-message-btn');
        const chatInput = document.getElementById('chat-input');
        
        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Load existing messages
        this.loadChatMessages();
    }

    /**
     * Initialize ride action buttons
     */
    initializeRideButtons() {
        // Prevent duplicate initialization
        if (this.rideButtonsInitialized) {
            return;
        }
        
        const onWayBtn = document.getElementById('onWayBtn');
        const arrivedBtn = document.getElementById('arrivedBtn');
        const completeBtn = document.getElementById('completeRideBtn');
        
        if (onWayBtn) {
            onWayBtn.addEventListener('click', () => this.onWayToPickup());
        }
        if (arrivedBtn) {
            arrivedBtn.addEventListener('click', () => this.arrivedAtPickup());
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeRide());
        }
        
        this.rideButtonsInitialized = true;
    }

    /**
     * Send chat message
     */
    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput || !chatInput.value.trim() || !this.currentRideId) return;
        
        try {
            const message = {
                rideId: parseInt(this.currentRideId),
                driverId: this.currentDriverId,
                riderId: null,
                sender: 'driver',
                senderName: 'You',
                content: chatInput.value.trim()
            };
            
            await apiService.sendChatMessage(message);
            chatInput.value = '';
            this.loadChatMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    /**
     * Load chat messages
     */
    async loadChatMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer || !this.currentRideId) return;
        
        try {
            const messages = await apiService.getChatMessages(this.currentRideId);
            
            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="bi bi-chat-dots" style="font-size: 2rem;"></i>
                        <p class="mt-2">Start chatting with your rider!</p>
                    </div>
                `;
                return;
            }
            
            messagesContainer.innerHTML = messages.map(msg => {
                const isDriver = msg.Sender === 'driver' || msg.sender === 'driver';
                const senderName = isDriver ? 'You' : (this.currentRide?.RiderName || this.currentRide?.riderName || 'Rider');
                
                return `
                    <div class="message mb-2 ${isDriver ? 'text-end' : 'text-start'}">
                        <div class="d-inline-block p-2 rounded-3 ${isDriver ? 'bg-primary text-white' : 'bg-light text-dark'}" style="max-width: 70%;">
                            <small class="d-block opacity-75 mb-1">${senderName}</small>
                            ${msg.Content || msg.content || ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    }

    /**
     * On way to pickup button handler
     */
    async onWayToPickup() {
        if (!this.currentRideId) return;
        
        try {
            // Send message to rider
            const message = {
                rideId: parseInt(this.currentRideId),
                driverId: this.currentDriverId,
                riderId: null,
                sender: 'driver',
                senderName: 'You',
                content: 'I\'m on my way to pick you up!'
            };
            
            await apiService.sendChatMessage(message);
            this.loadChatMessages();
            
            // Enable arrived button
            const arrivedBtn = document.getElementById('arrivedBtn');
            if (arrivedBtn) {
                arrivedBtn.disabled = false;
            }
            
            // Disable on way button
            const onWayBtn = document.getElementById('onWayBtn');
            if (onWayBtn) {
                onWayBtn.disabled = true;
            }
            
            this.showNotification('Message sent to rider: On my way!', 'success');
        } catch (error) {
            console.error('Error sending on way message:', error);
        }
    }

    /**
     * Arrived at pickup button handler
     */
    async arrivedAtPickup() {
        if (!this.currentRideId) return;
        
        try {
            // Send message to rider
            const message = {
                rideId: parseInt(this.currentRideId),
                driverId: this.currentDriverId,
                riderId: null,
                sender: 'driver',
                senderName: 'You',
                content: 'I\'ve arrived at your pickup location!'
            };
            
            await apiService.sendChatMessage(message);
            this.loadChatMessages();
            
            // Enable complete ride button
            const completeBtn = document.getElementById('completeRideBtn');
            if (completeBtn) {
                completeBtn.disabled = false;
            }
            
            // Disable arrived button
            const arrivedBtn = document.getElementById('arrivedBtn');
            if (arrivedBtn) {
                arrivedBtn.disabled = true;
            }
            
            this.showNotification('Message sent to rider: Arrived at pickup!', 'success');
        } catch (error) {
            console.error('Error sending arrived message:', error);
        }
    }

    /**
     * Complete ride button handler
     */
    async completeRide() {
        if (!this.currentRideId) return;
        
        try {
            // Complete the ride
            await apiService.completeRide(this.currentDriverId, this.currentRideId);
            
            this.showNotification('Ride completed successfully!', 'success');
            
            // Wait 2 seconds then reset
            setTimeout(() => {
                this.resetActiveRide();
            }, 2000);
            
        } catch (error) {
            console.error('Error completing ride:', error);
        }
    }

    /**
     * Reset active ride state
     */
    resetActiveRide() {
        this.currentRide = null;
        this.currentRideId = null;
        
        // Hide active ride state, show no ride state
        const activeRideState = document.getElementById('activeRideState');
        const noRideState = document.getElementById('noRideState');
        
        if (activeRideState) {
            activeRideState.classList.add('d-none');
        }
        if (noRideState) {
            noRideState.classList.remove('d-none');
        }
        
        // Reset buttons
        const onWayBtn = document.getElementById('onWayBtn');
        const arrivedBtn = document.getElementById('arrivedBtn');
        const completeBtn = document.getElementById('completeRideBtn');
        
        if (onWayBtn) onWayBtn.disabled = false;
        if (arrivedBtn) arrivedBtn.disabled = true;
        if (completeBtn) completeBtn.disabled = true;
        
        // Clear chat
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-chat-dots" style="font-size: 2rem;"></i>
                    <p class="mt-2">Start chatting with your rider!</p>
                </div>
            `;
        }
        
        // Show requests UI again
        this.showRequestsUI();
    }

    /**
     * Update driver status
     */
    async updateDriverStatus(isAvailable) {
        try {
            await apiService.updateDriverStatus(this.currentDriverId, { IsAvailable: isAvailable });
            this.showNotification(`Status updated to ${isAvailable ? 'Available' : 'Offline'}`, 'success');
            
            // Update UI elements
            this.updateToggleButton(isAvailable);
            
        } catch (error) {
            console.error('Error updating driver status:', error);
            this.showNotification('Failed to update status.', 'danger');
        }
    }

    /**
     * Load ride history for the driver
     */
    async loadRideHistory() {
        try {
            const rideHistory = await apiService.getRideHistory();
            this.updateRideHistoryTable(rideHistory);
            this.updateDriverStats(rideHistory);
        } catch (error) {
            console.error('Error loading ride history:', error);
            this.showNotification('Failed to load ride history.', 'warning');
        }
    }

    /**
     * Update ride history table with actual data
     */
    updateRideHistoryTable(rideHistory) {
        const tableBody = document.getElementById('rideHistoryTable');
        if (!tableBody) return;

        if (!rideHistory || rideHistory.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="bi bi-clock-history me-2"></i>No completed rides yet
                    </td>
                </tr>
            `;
            return;
        }

        // Filter rides for this driver and completed rides only
        const driverRides = rideHistory.filter(ride => 
            (ride.driverId || ride.DriverId) === this.currentDriverId && 
            (ride.status || ride.Status) === 'Completed'
        );

        if (driverRides.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="bi bi-clock-history me-2"></i>No completed rides yet
                    </td>
                </tr>
            `;
            return;
        }

        // Populate table with actual ride data
        tableBody.innerHTML = driverRides.map(ride => {
            const rideTime = new Date(ride.startTime || ride.StartTime).toLocaleString();
            const riderName = ride.riderName || ride.RiderName || 'Unknown Rider';
            const pickup = ride.pickupLocation || ride.PickupLocation || 'Unknown';
            const dropoff = ride.dropoffLocation || ride.DropoffLocation || 'Unknown';
            const fare = ride.estimatedFare || ride.EstimatedFare || 0;
            const status = ride.status || ride.Status || 'Unknown';

            return `
                <tr>
                    <td>${rideTime}</td>
                    <td>${riderName}</td>
                    <td>${pickup} → ${dropoff}</td>
                    <td>$${fare.toFixed(2)}</td>
                    <td><span class="badge bg-success">${status}</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Update driver statistics
     */
    updateDriverStats(rideHistory) {
        // Filter rides for this driver and completed rides only
        const driverRides = rideHistory.filter(ride => 
            (ride.driverId || ride.DriverId) === this.currentDriverId && 
            (ride.status || ride.Status) === 'Completed'
        );

        // Calculate total earnings
        const totalEarnings = driverRides.reduce((sum, ride) => {
            return sum + (ride.estimatedFare || ride.EstimatedFare || 0);
        }, 0);

        // Update total earnings display
        const totalEarningsElement = document.getElementById('totalEarnings');
        if (totalEarningsElement) {
            totalEarningsElement.textContent = `$${totalEarnings.toFixed(2)}`;
        }

        // Get driver's current rating from driver data
        this.updateDriverRating();
    }

    /**
     * Update driver rating display
     */
    async updateDriverRating() {
        try {
            const driver = await apiService.getDriver(this.currentDriverId);
            const rating = driver.rating || driver.Rating || 0;
            
            const averageRatingElement = document.getElementById('averageRating');
            if (averageRatingElement) {
                averageRatingElement.textContent = rating.toFixed(1);
            }
        } catch (error) {
            console.error('Error updating driver rating:', error);
        }
    }

    /**
     * Refresh requests
     */
    refreshRequests() {
        this.updateRequestsUI();
        this.showNotification('Requests refreshed', 'info');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notificationHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 10000; min-width: 300px;" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', notificationHtml);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

}

// Initialize driver interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Ensure API service is loaded first
    if (typeof apiService === 'undefined') {
        console.error('ApiService not loaded! Check script loading order.');
        alert('ApiService not loaded! Please refresh the page.');
        return;
    }
    
    
    setTimeout(() => {
        if (typeof DriverInterface !== 'undefined') {
            window.driverInterface = new DriverInterface();
        } else {
            console.error('DriverInterface not loaded!');
        }
    }, 200);
});
