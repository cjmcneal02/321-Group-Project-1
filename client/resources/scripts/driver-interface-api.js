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
        this.selectedRating = 0;

        this.init();
    }

    async init() {
        // Load available drivers for login dropdown
        await this.loadAvailableDrivers();
        
        // Set up toggle status button
        this.setupToggleStatusButton();
        
        // Initialize rating system
        this.initializeRatingSystem();
        
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

        // Update requests visibility based on availability
        const isAvailable = driver.isAvailable !== undefined ? driver.isAvailable : driver.IsAvailable;
        this.updateRequestsVisibility(isAvailable);
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
        
        // Hide driver status panel and make active ride panel full-width
        this.hideDriverStatusPanel();
        this.makeActiveRidePanelFullWidth();
        
        // Load chat messages and start polling
        this.loadChatMessages();
        this.startChatPolling();
        
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

        // Update button states based on driver location
        this.updateDriverLocationButtons(ride.DriverLocation || ride.driverLocation);
    }

    /**
     * Update driver location buttons based on current driver location
     */
    updateDriverLocationButtons(driverLocation) {
        const onWayBtn = document.getElementById('onWayBtn');
        const arrivedBtn = document.getElementById('arrivedBtn');
        const completeBtn = document.getElementById('completeRideBtn');
        
        // Reset all buttons to default state
        if (onWayBtn) onWayBtn.disabled = false;
        if (arrivedBtn) arrivedBtn.disabled = true;
        if (completeBtn) completeBtn.disabled = true;
        
        // Set button states based on driver location
        switch (driverLocation) {
            case 'PreRide':
                // Only "On Way to Pickup" button enabled
                if (onWayBtn) onWayBtn.disabled = false;
                if (arrivedBtn) arrivedBtn.disabled = true;
                if (completeBtn) completeBtn.disabled = true;
                break;
            case 'OnWay':
                if (onWayBtn) onWayBtn.disabled = true;
                if (arrivedBtn) arrivedBtn.disabled = false;
                if (completeBtn) completeBtn.disabled = true;
                break;
            case 'AtPickup':
                if (onWayBtn) onWayBtn.disabled = true;
                if (arrivedBtn) arrivedBtn.disabled = true;
                if (completeBtn) completeBtn.disabled = false;
                break;
            case 'AtDropoff':
                if (onWayBtn) onWayBtn.disabled = true;
                if (arrivedBtn) arrivedBtn.disabled = true;
                if (completeBtn) completeBtn.disabled = false;
                break;
            default:
                // Default state - only "On Way" button enabled (PreRide behavior)
                if (onWayBtn) onWayBtn.disabled = false;
                if (arrivedBtn) arrivedBtn.disabled = true;
                if (completeBtn) completeBtn.disabled = true;
                break;
        }
    }

    /**
     * Hide driver status panel
     */
    hideDriverStatusPanel() {
        const driverStatusPanel = document.querySelector('.col-lg-4');
        if (driverStatusPanel) {
            driverStatusPanel.style.display = 'none';
        }
    }

    /**
     * Show driver status panel
     */
    showDriverStatusPanel() {
        const driverStatusPanel = document.querySelector('.col-lg-4');
        if (driverStatusPanel) {
            driverStatusPanel.style.display = 'block';
        }
    }

    /**
     * Make active ride panel full-width
     */
    makeActiveRidePanelFullWidth() {
        const activeRidePanel = document.querySelector('.col-lg-8');
        if (activeRidePanel) {
            activeRidePanel.className = 'col-12';
        }
    }

    /**
     * Restore active ride panel to normal width
     */
    restoreActiveRidePanelWidth() {
        const activeRidePanel = document.querySelector('.col-12');
        if (activeRidePanel) {
            activeRidePanel.className = 'col-lg-8';
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
        
        // Start chat polling for real-time updates
        this.startChatPolling();
    }

    /**
     * Start chat polling for real-time message updates
     */
    startChatPolling() {
        // Clear any existing polling
        this.stopChatPolling();
        
        this.chatPollingInterval = setInterval(async () => {
            if (this.currentRideId) {
                await this.loadChatMessages();
            }
        }, 2000); // Poll every 2 seconds
    }

    /**
     * Stop chat polling
     */
    stopChatPolling() {
        if (this.chatPollingInterval) {
            clearInterval(this.chatPollingInterval);
            this.chatPollingInterval = null;
        }
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
            // Update driver location in database
            await apiService.updateDriverLocation(this.currentRideId, 'OnWay');
            
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
            // Update driver location in database
            await apiService.updateDriverLocation(this.currentRideId, 'AtPickup');
            
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
            // Update driver location to AtDropoff before completing
            await apiService.updateDriverLocation(this.currentRideId, 'AtDropoff');
            
            // Complete the ride
            await apiService.completeRide(this.currentDriverId, this.currentRideId);
            
            // Send completion message to rider to trigger rating modal
            const message = {
                rideId: parseInt(this.currentRideId),
                driverId: this.currentDriverId,
                riderId: null,
                sender: 'driver',
                senderName: 'Driver',
                content: 'Ride completed! Please confirm completion.'
            };
            
            await apiService.sendChatMessage(message);
            
            this.showNotification('Ride completed successfully!', 'success');
            
            // Show rating modal after completion
            setTimeout(() => {
                this.showRatingModal();
            }, 1000);
            
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
        
        // Stop chat polling
        this.stopChatPolling();
        
        // Hide active ride state, show no ride state
        const activeRideState = document.getElementById('activeRideState');
        const noRideState = document.getElementById('noRideState');
        
        if (activeRideState) {
            activeRideState.classList.add('d-none');
        }
        if (noRideState) {
            noRideState.classList.remove('d-none');
        }
        
        // Restore normal layout - show driver status panel and restore active ride panel width
        this.showDriverStatusPanel();
        this.restoreActiveRidePanelWidth();
        
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
            
            // Show/hide ride requests based on availability
            this.updateRequestsVisibility(isAvailable);
            
        } catch (error) {
            console.error('Error updating driver status:', error);
            this.showNotification('Failed to update status.', 'danger');
        }
    }

    /**
     * Update requests visibility based on driver availability
     */
    updateRequestsVisibility(isAvailable) {
        const requestsSection = document.getElementById('requests-section');
        if (requestsSection) {
            if (isAvailable) {
                requestsSection.style.display = 'block';
            } else {
                requestsSection.style.display = 'none';
            }
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
        const driverRides = rideHistory.filter(ride => {
            const rideDriverId = ride.driverId || ride.DriverId;
            const rideStatus = ride.status || ride.Status;
            return rideDriverId === this.currentDriverId && rideStatus === 'Completed';
        });

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

        // Sort by completion time (most recent first) and take only the 3 most recent
        const recentRides = driverRides
            .sort((a, b) => {
                const timeA = new Date(a.endTime || a.EndTime);
                const timeB = new Date(b.endTime || b.EndTime);
                return timeB - timeA; // Most recent first
            })
            .slice(0, 3); // Only show 3 most recent

        // Populate table with actual ride data
        tableBody.innerHTML = recentRides.map(ride => {
            const endTime = new Date(ride.endTime || ride.EndTime);
            const timeAgo = this.formatTimeAgo(endTime);
            const riderName = ride.riderName || ride.RiderName || 'Unknown Rider';
            const pickup = ride.pickupLocation || ride.PickupLocation || 'Unknown';
            const dropoff = ride.dropoffLocation || ride.DropoffLocation || 'Unknown';
            const fare = ride.estimatedFare || ride.EstimatedFare || 0;
            const status = ride.status || ride.Status || 'Unknown';

            return `
                <tr>
                    <td>${timeAgo}</td>
                    <td>${riderName}</td>
                    <td>${pickup} → ${dropoff}</td>
                    <td>$${fare.toFixed(2)}</td>
                    <td><span class="badge bg-success">${status}</span></td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Format time ago (copied from rider interface)
     */
    formatTimeAgo(date) {
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInYears = Math.floor(diffInDays / 365);

        if (diffInMinutes < 60) {
            return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        } else if (diffInWeeks < 52) {
            return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
        }
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

        // Update total rides display
        const totalRidesElement = document.getElementById('totalRides');
        if (totalRidesElement) {
            totalRidesElement.textContent = driverRides.length;
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
        // Remove existing notifications immediately
        const existingNotifications = document.querySelectorAll('.alert');
        existingNotifications.forEach(notification => {
            // Force immediate removal without animation
            notification.style.transition = 'none';
            notification.style.opacity = '0';
            notification.remove();
        });

        const alertClass = {
            'success': 'alert-success',
            'danger': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notificationHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 10000; min-width: 300px; opacity: 1 !important; background-color: var(--bs-alert-bg) !important;" role="alert">
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

    // ===== RATING SYSTEM =====
    showRatingModal() {
        // Update rider info in rating modal
        if (this.currentRide) {
            document.getElementById('rating-rider-name').textContent = this.currentRide.RiderName || this.currentRide.riderName || 'Unknown Rider';
            document.getElementById('rating-ride-details').textContent = 
                `${this.currentRide.PickupLocation || this.currentRide.pickupLocation} → ${this.currentRide.DropoffLocation || this.currentRide.dropoffLocation}`;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('rating-modal'));
        modal.show();
    }

    initializeRatingSystem() {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => this.selectRating(index + 1));
            star.addEventListener('mouseenter', () => this.highlightStars(index + 1));
        });
        
        const starContainer = document.getElementById('star-rating');
        if (starContainer) {
            starContainer.addEventListener('mouseleave', () => this.resetStarHighlight());
        }
    }

    selectRating(rating) {
        this.selectedRating = rating;
        this.updateStarDisplay(rating);
        this.updateRatingText(rating);
        this.updateSubmitButton();
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.className = 'bi bi-star-fill star active'; // Use filled star
            } else {
                star.classList.remove('active');
                star.className = 'bi bi-star star'; // Use outline star
            }
        });
    }

    resetStarHighlight() {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.classList.remove('active');
            star.className = 'bi bi-star star'; // Reset to outline star
        });
        
        if (this.selectedRating > 0) {
            this.updateStarDisplay(this.selectedRating);
        }
    }

    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.className = 'bi bi-star-fill star active'; // Use filled star
            } else {
                star.classList.remove('active');
                star.className = 'bi bi-star star'; // Use outline star
            }
        });
    }

    updateRatingText(rating) {
        const ratingText = document.getElementById('rating-text');
        if (ratingText) {
            const texts = {
                1: 'Poor',
                2: 'Fair',
                3: 'Good',
                4: 'Very Good',
                5: 'Excellent'
            };
            ratingText.textContent = texts[rating] || 'Tap a star to rate';
        }
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('submit-rating-btn');
        if (submitBtn) {
            submitBtn.disabled = this.selectedRating === 0;
        }
    }

    async submitRating() {
        if (this.selectedRating === 0) return;
        
        try {
            const comments = document.getElementById('rating-comments').value;
            const ratingData = {
                rideId: parseInt(this.currentRideId),
                rating: this.selectedRating,
                comments: comments
            };
            
            await apiService.submitRiderRating(ratingData);
            
            // Hide rating modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('rating-modal'));
            if (modal) {
                modal.hide();
            }
            
            // Show thank you modal
        setTimeout(() => {
                this.showThankYouModal();
            }, 300);
            
        } catch (error) {
            console.error('Error submitting rating:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            alert(`Error submitting rating: ${errorMessage}`);
        }
    }

    showThankYouModal() {
        const modal = new bootstrap.Modal(document.getElementById('thank-you-modal'));
        modal.show();
    }

    closeThankYouModal() {
        // Hide thank you modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('thank-you-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset active ride and clear localStorage
        this.resetActiveRide();
        localStorage.removeItem('activeRideId');
    }

}

// Global functions for modal buttons
function skipRating() {
    if (window.driverInterface) {
        window.driverInterface.closeThankYouModal();
    }
}

function submitRating() {
    if (window.driverInterface) {
        window.driverInterface.submitRating();
    }
}

function closeThankYouModal() {
    if (window.driverInterface) {
        window.driverInterface.closeThankYouModal();
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
