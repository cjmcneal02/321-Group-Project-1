/**
 * Driver Interface Module for Tide Rides - API Version
 * Uses RESTful API calls instead of AppState
 */

class DriverInterface {
    constructor() {
        console.log('🚗 DRIVER INTERFACE CONSTRUCTOR CALLED! 🚗');
        
        // Check for API service availability
        if (typeof apiService === 'undefined') {
            console.error('ApiService not available. Please ensure api-service.js is loaded.');
            return;
        }
        
        console.log('DriverInterface: ApiService available, initializing...');

        this.currentDriverId = 1; // Default driver ID
        this.currentRide = null;
        this.requestsPollingInterval = null;
        this.chatPollingInterval = null;
        this.currentRideId = null;

        this.initializeInterface();
    }

    /**
     * Initialize the driver interface
     */
    initializeInterface() {
        console.log('DriverInterface: Initializing interface...');
        this.setupEventListeners();
        this.updateDriverInfo();
        this.startRequestsPolling();
        console.log('DriverInterface: Interface initialized successfully');
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
        const driverNameElement = document.querySelector('.driver-name');
        if (driverNameElement) {
            driverNameElement.textContent = driver.Name;
        }

        const driverStatusElement = document.querySelector('.driver-status');
        if (driverStatusElement) {
            driverStatusElement.textContent = driver.Status;
            driverStatusElement.className = `driver-status badge ${driver.IsAvailable ? 'bg-success' : 'bg-danger'}`;
        }

        const batteryElement = document.querySelector('.battery-level');
        if (batteryElement) {
            batteryElement.textContent = `${driver.BatteryLevel}%`;
        }

        const ratingElement = document.querySelector('.driver-rating');
        if (ratingElement) {
            ratingElement.textContent = driver.Rating.toFixed(1);
        }

        const totalRidesElement = document.querySelector('.total-rides');
        if (totalRidesElement) {
            totalRidesElement.textContent = driver.TotalRides;
        }
    }

    /**
     * Start polling for ride requests
     */
    startRequestsPolling() {
        console.log('DriverInterface: Starting requests polling...');
        this.requestsPollingInterval = setInterval(async () => {
            try {
                await this.updateRequestsUI();
            } catch (error) {
                console.error('Error updating requests UI:', error);
            }
        }, 1000); // Poll every second

        // Initial update
        this.updateRequestsUI();
        console.log('DriverInterface: Requests polling started');
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
            console.log('Driver: Fetching ride requests...');
            const requests = await apiService.getRideRequests();
            console.log('🚨 DRIVER RECEIVED REQUESTS:', requests.length, 'requests!');
            console.log('Driver: Received requests:', requests);
            console.log('Driver: First request details:', requests[0]);
            const requestsList = document.getElementById('requestsList');
            console.log('🔍 Driver: requestsList element:', requestsList);
            
            if (!requestsList) {
                console.error('❌ Driver: requestsList element not found');
                return;
            }
            
            console.log('✅ Driver: requestsList element found!');

            // Clear existing requests
            requestsList.innerHTML = '';

            if (requests.length === 0) {
                console.log('📭 Driver: No requests, showing no requests state');
                // Show no requests state
                const noRequestsState = document.getElementById('noRequestsState');
                console.log('📭 Driver: noRequestsState element:', noRequestsState);
                if (noRequestsState) {
                    noRequestsState.classList.remove('d-none');
                    console.log('📭 Driver: Removed d-none from noRequestsState');
                }
                requestsList.classList.add('d-none');
                console.log('📭 Driver: Added d-none to requestsList');
                return;
            }

            console.log('📋 Driver: Has requests, hiding no requests state and showing requests list');
            // Hide no requests state and show requests list
            const noRequestsState = document.getElementById('noRequestsState');
            console.log('📋 Driver: noRequestsState element:', noRequestsState);
            if (noRequestsState) {
                noRequestsState.classList.add('d-none');
                console.log('📋 Driver: Added d-none to noRequestsState');
            }
            requestsList.classList.remove('d-none');
            console.log('📋 Driver: Removed d-none from requestsList');

            // Remove duplicates based on ID
            const uniqueRequests = requests.filter((request, index, self) => {
                const requestId = request.Id || request.id;
                return index === self.findIndex(r => (r.Id || r.id) === requestId);
            });

            // Display requests
            console.log('🎨 DRIVER RENDERING', uniqueRequests.length, 'UNIQUE REQUESTS!');
            uniqueRequests.forEach((request, index) => {
                console.log(`🎨 Driver: Rendering request ${index + 1}:`, request);
                const requestElement = this.createRequestElement(request);
                requestsList.appendChild(requestElement);
                console.log(`✅ Request ${index + 1} added to DOM!`);
            });
            console.log('🎉 DRIVER FINISHED RENDERING ALL REQUESTS!');

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
        const requestId = request.Id || request.id;

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
                <button class="btn btn-success btn-sm me-2" onclick="driverInterface.acceptRequest(${requestId})">
                    <i class="bi bi-check-circle me-1"></i>Accept
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="driverInterface.declineRequest(${requestId})">
                    <i class="bi bi-x-circle me-1"></i>Decline
                </button>
            </div>
        `;

        return requestDiv;
    }

    /**
     * Accept ride request
     */
    async acceptRequest(requestId) {
        try {
            const ride = await apiService.acceptRideRequest(requestId, this.currentDriverId);
            
            if (ride) {
                this.currentRide = ride;
                this.currentRideId = ride.Id;
                
                // Hide requests and show active ride
                this.hideRequestsUI();
                this.showActiveRideUI(ride);
                this.showChatInterface(ride.Id);
                
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
    async declineRequest(requestId) {
        try {
            await apiService.deleteRideRequest(requestId);
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
        const activeRideSection = document.getElementById('active-ride-section');
        if (activeRideSection) {
            activeRideSection.style.display = 'block';
            activeRideSection.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Active Ride</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <strong>Rider:</strong><br>
                                <span>${ride.RiderName}</span>
                            </div>
                            <div class="col-6">
                                <strong>Fare:</strong><br>
                                <span class="text-success">$${ride.EstimatedFare.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <strong>From:</strong><br>
                                <span>${ride.PickupLocation}</span>
                            </div>
                            <div class="col-6">
                                <strong>To:</strong><br>
                                <span>${ride.DropoffLocation}</span>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <strong>Passengers:</strong><br>
                                <span>${ride.PassengerCount}</span>
                            </div>
                            <div class="col-6">
                                <strong>Cart Size:</strong><br>
                                <span>${ride.CartSize}</span>
                            </div>
                        </div>
                        <div class="text-center">
                            <button class="btn btn-success btn-lg" onclick="driverInterface.completeRide()">
                                <i class="bi bi-check-circle me-2"></i>Complete Ride
                            </button>
                        </div>
                    </div>
                </div>
            `;
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

            const result = await apiService.completeRide(this.currentDriverId, this.currentRide.Id);
            
            if (result) {
                // Send completion message to rider
                await apiService.sendChatMessage(
                    this.currentRide.Id,
                    'driver',
                    'Stacy Streets',
                    'Ride completed! Please confirm completion.'
                );

                this.showNotification('Ride completed successfully!', 'success');
                
                // Reset UI
                this.hideActiveRideUI();
                this.hideChatInterface();
                this.showRequestsUI();
                
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
     * Update driver status
     */
    async updateDriverStatus(isAvailable) {
        try {
            await apiService.updateDriverStatus(this.currentDriverId, isAvailable);
            this.showNotification(`Status updated to ${isAvailable ? 'Available' : 'Offline'}`, 'success');
        } catch (error) {
            console.error('Error updating driver status:', error);
            this.showNotification('Failed to update status.', 'danger');
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
    console.log('DriverInterface: DOMContentLoaded event fired');
    
    // Ensure API service is loaded first
    if (typeof apiService === 'undefined') {
        console.error('ApiService not loaded! Check script loading order.');
        alert('ApiService not loaded! Please refresh the page.');
        return;
    }
    
    console.log('DriverInterface: ApiService found, creating DriverInterface...');
    
    setTimeout(() => {
        if (typeof DriverInterface !== 'undefined') {
            console.log('DriverInterface: Creating new DriverInterface instance...');
            window.driverInterface = new DriverInterface();
        } else {
            console.error('DriverInterface not loaded!');
        }
    }, 200);
});
