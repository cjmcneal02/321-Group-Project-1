/**
 * Active Ride Interface Module for Tide Rides - API Version
 * Handles the active ride page with chat functionality
 */

class ActiveRideInterface {
    constructor() {
        // Check for API service availability
        if (typeof apiService === 'undefined') {
            console.error('ApiService not available. Please ensure api-service.js is loaded.');
            this.showNotification('System unavailable. Please refresh the page and try again.', 'danger');
            return;
        }

        this.currentRideId = this.getRideIdFromUrl();
        this.currentRide = null;
        this.chatPollingInterval = null;
        this.statusPollingInterval = null;

        if (this.currentRideId) {
            this.initializeInterface();
        } else {
            this.showNotification('No ride ID found in URL. Redirecting to rider page.', 'warning');
            setTimeout(() => {
                window.location.href = './rider.html';
            }, 2000);
        }
    }

    /**
     * Get ride ID from URL parameters
     */
    getRideIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('rideId');
    }

    /**
     * Initialize the active ride interface
     */
    async initializeInterface() {
        try {
            await this.loadRideDetails();
            this.setupEventListeners();
            this.startStatusPolling();
            this.startChatPolling();
        } catch (error) {
            console.error('Error initializing active ride interface:', error);
            this.showNotification('Failed to load ride details. Please try again.', 'danger');
        }
    }

    /**
     * Load ride details from API
     */
    async loadRideDetails() {
        try {
            this.currentRide = await apiService.getRide(this.currentRideId);
            
            if (!this.currentRide) {
                throw new Error('Ride not found');
            }

            this.updateRideDisplay();
        } catch (error) {
            console.error('Error loading ride details:', error);
            throw error;
        }
    }

    /**
     * Update ride display
     */
    updateRideDisplay() {
        if (!this.currentRide) return;

        // Update ride details
        const rideDetailsElement = document.getElementById('ride-details');
        if (rideDetailsElement) {
            rideDetailsElement.innerHTML = `
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>From:</strong><br>
                        <span class="text-muted">${this.currentRide.PickupLocation}</span>
                    </div>
                    <div class="col-6">
                        <strong>To:</strong><br>
                        <span class="text-muted">${this.currentRide.DropoffLocation}</span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Passengers:</strong><br>
                        <span class="text-muted">${this.currentRide.PassengerCount}</span>
                    </div>
                    <div class="col-6">
                        <strong>Cart Size:</strong><br>
                        <span class="text-muted">${this.currentRide.CartSize}</span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Estimated Fare:</strong><br>
                        <span class="text-success fs-5">$${this.currentRide.EstimatedFare.toFixed(2)}</span>
                    </div>
                    <div class="col-6">
                        <strong>Status:</strong><br>
                        <span class="badge bg-primary">${this.currentRide.Status}</span>
                    </div>
                </div>
            `;
        }

        // Update driver info
        const driverInfoElement = document.getElementById('driver-info');
        if (driverInfoElement && this.currentRide.Driver) {
            driverInfoElement.innerHTML = `
                <div class="driver-info-card p-3 mb-3">
                    <div class="row align-items-center">
                        <div class="col-8">
                            <h5 class="mb-1">${this.currentRide.Driver.Name}</h5>
                            <div class="driver-details">
                                <div class="row">
                                    <div class="col-6">
                                        <small class="text-light">Vehicle:</small><br>
                                        <span>${this.currentRide.Driver.VehicleName}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-light">Rating:</small><br>
                                        <span>${this.currentRide.Driver.Rating.toFixed(1)} ⭐</span>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-6">
                                        <small class="text-light">Battery:</small><br>
                                        <span>${this.currentRide.Driver.BatteryLevel}%</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-light">Total Rides:</small><br>
                                        <span>${this.currentRide.Driver.TotalRides}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-4 text-center">
                            <div class="driver-avatar">
                                <i class="bi bi-person-circle fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update page title
        document.title = `Active Ride - ${this.currentRide.RiderName}`;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input enter key
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Cancel ride button
        const cancelBtn = document.getElementById('cancel-ride-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelRide());
        }

        // Emergency contact button
        const emergencyBtn = document.getElementById('emergency-btn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.showEmergencyModal());
        }
    }

    /**
     * Start status polling
     */
    startStatusPolling() {
        this.statusPollingInterval = setInterval(async () => {
            try {
                await this.checkRideStatus();
            } catch (error) {
                console.error('Error checking ride status:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    /**
     * Stop status polling
     */
    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
    }

    /**
     * Check ride status
     */
    async checkRideStatus() {
        try {
            const ride = await apiService.getRide(this.currentRideId);
            
            if (!ride) {
                // Ride no longer exists
                this.stopStatusPolling();
                this.stopChatPolling();
                this.showNotification('Ride has been cancelled.', 'warning');
                setTimeout(() => {
                    window.location.href = './rider.html';
                }, 2000);
                return;
            }

            if (ride.Status === 'Completed') {
                // Ride completed
                this.stopStatusPolling();
                this.stopChatPolling();
                this.showRideCompletionModal();
                return;
            }

            // Update ride status if changed
            if (ride.Status !== this.currentRide.Status) {
                this.currentRide = ride;
                this.updateRideDisplay();
            }

        } catch (error) {
            console.error('Error checking ride status:', error);
        }
    }

    /**
     * Start chat polling
     */
    startChatPolling() {
        this.chatPollingInterval = setInterval(async () => {
            try {
                await this.loadChatMessages();
            } catch (error) {
                console.error('Error polling chat messages:', error);
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
     * Load chat messages
     */
    async loadChatMessages() {
        try {
            const messages = await apiService.getChatMessages(this.currentRideId);
            const messagesContainer = document.getElementById('chat-messages');
            
            if (messagesContainer) {
                messagesContainer.innerHTML = messages.map(message => `
                    <div class="message ${message.Sender === 'rider' ? 'message-rider' : 'message-driver'} mb-2">
                        <div class="message-content p-2 rounded">
                            <strong>${message.SenderName}:</strong> ${message.Content}
                            <small class="text-muted d-block">${new Date(message.CreatedAt).toLocaleTimeString()}</small>
                        </div>
                    </div>
                `).join('');
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Check for ride completion message
            const completionMessage = messages.find(msg => 
                msg.Sender === 'driver' && 
                msg.Content.toLowerCase().includes('ride completed')
            );

            if (completionMessage) {
                this.showRideCompletionModal();
            }

        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    }

    /**
     * Send message
     */
    async sendMessage() {
        try {
            const messageInput = document.getElementById('message-input');
            const message = messageInput.value.trim();
            
            if (!message) return;

            const riderName = this.currentRide.RiderName;
            
            await apiService.sendChatMessage(
                this.currentRideId,
                'rider',
                riderName,
                message
            );

            messageInput.value = '';
            
            // Reload messages immediately
            await this.loadChatMessages();

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message. Please try again.', 'danger');
        }
    }

    /**
     * Show ride completion modal
     */
    showRideCompletionModal() {
        const modalHtml = `
            <div id="ride-completion-modal" class="modal fade show" style="display: block; z-index: 10000;" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">Ride Completed!</h5>
                        </div>
                        <div class="modal-body">
                            <p>Your ride has been completed by the driver. Please confirm completion to finish the ride.</p>
                            <div class="text-center">
                                <strong>Total Fare:</strong><br>
                                <span class="text-success fs-4">$${this.currentRide.EstimatedFare.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" onclick="activeRideInterface.confirmRideCompletion()">
                                Confirm Completion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Confirm ride completion
     */
    async confirmRideCompletion() {
        try {
            // Clear chat messages
            await apiService.clearChatMessages(this.currentRideId);
            
            // Hide completion modal
            const modal = document.getElementById('ride-completion-modal');
            if (modal) {
                modal.remove();
            }

            // Stop polling
            this.stopStatusPolling();
            this.stopChatPolling();

            // Show success message
            this.showNotification('Ride completed successfully! Thank you for using Tide Rides.', 'success');

            // Redirect to rider page after delay
            setTimeout(() => {
                window.location.href = './rider.html';
            }, 2000);

        } catch (error) {
            console.error('Error confirming ride completion:', error);
            this.showNotification('Failed to confirm completion. Please try again.', 'danger');
        }
    }

    /**
     * Cancel ride
     */
    async cancelRide() {
        if (confirm('Are you sure you want to cancel this ride?')) {
            try {
                // Clear chat messages
                await apiService.clearChatMessages(this.currentRideId);
                
                // Stop polling
                this.stopStatusPolling();
                this.stopChatPolling();

                this.showNotification('Ride cancelled.', 'info');
                
                // Redirect to rider page
                setTimeout(() => {
                    window.location.href = './rider.html';
                }, 1000);

            } catch (error) {
                console.error('Error cancelling ride:', error);
                this.showNotification('Failed to cancel ride. Please try again.', 'danger');
            }
        }
    }

    /**
     * Show emergency modal
     */
    showEmergencyModal() {
        const modalHtml = `
            <div id="emergency-modal" class="modal fade show" style="display: block; z-index: 10000;" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Emergency Contact</h5>
                        </div>
                        <div class="modal-body">
                            <p>In case of emergency, please contact:</p>
                            <div class="text-center">
                                <h4>Campus Security</h4>
                                <p class="fs-5">(205) 348-5454</p>
                                <button class="btn btn-danger" onclick="window.open('tel:2053485454')">
                                    <i class="bi bi-telephone me-2"></i>Call Now
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
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

// Initialize active ride interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure API service is loaded first
    if (typeof apiService === 'undefined') {
        console.error('ApiService not loaded! Check script loading order.');
        alert('ApiService not loaded! Please refresh the page.');
        return;
    }
    
    setTimeout(() => {
        if (typeof ActiveRideInterface !== 'undefined') {
            window.activeRideInterface = new ActiveRideInterface();
        } else {
            console.error('ActiveRideInterface not loaded!');
        }
    }, 200);
});
