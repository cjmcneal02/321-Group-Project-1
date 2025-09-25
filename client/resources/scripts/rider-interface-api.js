/**
 * Rider Interface Module for Tide Rides - API Version
 * Uses RESTful API calls instead of AppState
 */

class RiderInterface {
    constructor() {
        try {
            this.campusData = new CampusData();
            
            // Validate data integrity
            if (!this.campusData.validatePopularRoutes()) {
                console.error('Campus data validation failed');
                return;
            }
            
        } catch (error) {
            console.error('Failed to initialize CampusData:', error);
            this.campusData = null;
            return;
        }

        // Check for API service availability
        if (typeof apiService === 'undefined') {
            console.error('ApiService not available. Please ensure api-service.js is loaded.');
            return;
        }
        
        if (this.campusData) {
            try {
                this.shortestPath = new ShortestPathAlgorithm(this.campusData);
                this.locationServices = new LocationServices(this.campusData);
            } catch (error) {
                console.error('Failed to initialize dependent classes:', error);
                return;
            }
        } else {
            return;
        }
        
        this.mapIntegration = null;
        this.currentRide = null;
        this.currentUser = null;
        this.rideHistory = [];
        this.locationWatchId = null;
        this.statusPollingInterval = null;
        this.driverSearchTimeout = null;
        
        this.init();
    }

    async init() {
        // Check if user is already logged in as a rider
        if (apiService.currentUserId && apiService.currentUserRole === 'Rider') {
            this.showDashboard();
            this.loadRiderData();
        } else {
            this.showLogin();
            await this.loadRiderUsers();
        }
    }

    async loadRiderUsers() {
        // No need to load from API - using hardcoded options
    }

    async loginRider() {
        const selectedRider = document.getElementById('rider-select').value;

        if (!selectedRider) {
            this.showNotification('Please select a rider account.', 'warning');
            return;
        }

        try {
            // Map selected rider to user data
            let userData;
            
            if (selectedRider === 'rider') {
                userData = {
                    id: 4,
                    username: 'rider',
                    role: 'Rider',
                    firstName: 'James',
                    lastName: 'Wilson'
                };
            }

            this.currentUser = userData;
            
            apiService.currentUserId = userData.id;
            apiService.currentUserRole = userData.role;

            this.showDashboard();
            this.loadRiderData();
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
        document.getElementById('rider-selection-section').style.display = 'block';
        document.getElementById('rider-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('rider-selection-section').style.display = 'none';
        document.getElementById('rider-dashboard').style.display = 'block';
    }

    loadRiderData() {
        if (this.campusData && this.locationServices) {
            this.initializeInterface();
        }
    }

    /**
     * Initialize the rider interface
     */
    initializeInterface() {
        this.setupEventListeners();
        this.loadUserData();
        this.updateLocationDisplay();
        this.populateLocationSuggestions();
        this.updateRideStatistics();
        this.initializeMap();
    }

    /**
     * Setup event listeners for the interface
     */
    setupEventListeners() {
        // Request ride button
        const requestBtn = document.getElementById('request-ride-btn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => this.handleRideRequest());
        }

        // Confirm ride button
        const confirmBtn = document.getElementById('confirm-ride-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmRide());
        }

        // Cancel ride button
        const cancelBtn = document.getElementById('cancel-ride-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelRide());
        }

        // Track ride button
        const trackBtn = document.getElementById('track-ride-btn');
        if (trackBtn) {
            trackBtn.addEventListener('click', () => this.trackRide());
        }

        // Use current location button
        const useCurrentLocationBtn = document.getElementById('use-current-location-btn');
        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => this.useCurrentLocation());
        }

        // Location input changes
        const pickupInput = document.getElementById('pickup-location');
        const dropoffInput = document.getElementById('dropoff-location');
        
        if (pickupInput) {
            pickupInput.addEventListener('input', () => this.updateFareEstimate());
        }
        
        if (dropoffInput) {
            dropoffInput.addEventListener('input', () => this.updateFareEstimate());
        }

        // Passenger count changes
        const passengerCountSelect = document.getElementById('passenger-count');
        if (passengerCountSelect) {
            passengerCountSelect.addEventListener('change', () => this.updateFareEstimate());
        }

        // Cart size changes
        const cartSizeSelect = document.getElementById('cart-size');
        if (cartSizeSelect) {
            cartSizeSelect.addEventListener('change', () => this.updateFareEstimate());
        }
    }

    /**
     * Handle ride request button click
     */
    async handleRideRequest() {
        try {
            const pickupLocation = document.getElementById('pickup-location')?.value?.trim();
            const dropoffLocation = document.getElementById('dropoff-location')?.value?.trim();
            const passengerCount = parseInt(document.getElementById('passenger-count')?.value) || 1;
            const cartSize = document.getElementById('cart-size')?.value || 'Standard';

            if (!pickupLocation || !dropoffLocation) {
                this.showNotification('Please select both pickup and dropoff locations.', 'warning');
                return;
            }

            if (pickupLocation === dropoffLocation) {
                this.showNotification('Pickup and dropoff locations cannot be the same.', 'warning');
                return;
            }

            // Calculate fare estimate
            const fareEstimate = this.calculateFareEstimate(pickupLocation, dropoffLocation, passengerCount, cartSize);

            // Show confirmation modal
            this.showRideConfirmation({
                pickupLocation,
                dropoffLocation,
                passengerCount,
                cartSize,
                estimatedFare: fareEstimate
            });

        } catch (error) {
            console.error('Error handling ride request:', error);
            this.showNotification('An error occurred while processing your request.', 'danger');
        }
    }

    /**
     * Confirm ride request
     */
    async confirmRide() {
        try {
            const pickupLocation = document.getElementById('pickup-location')?.value?.trim();
            const dropoffLocation = document.getElementById('dropoff-location')?.value?.trim();
            const passengerCount = parseInt(document.getElementById('passenger-count')?.value) || 1;
            const cartSize = document.getElementById('cart-size')?.value || 'Standard';
            const riderName = document.getElementById('rider-name')?.value?.trim() || 'Anonymous Rider';

            if (!pickupLocation || !dropoffLocation) {
                this.showNotification('Please select both pickup and dropoff locations.', 'warning');
                return;
            }

            // Calculate fare estimate
            const fareEstimate = this.calculateFareEstimate(pickupLocation, dropoffLocation, passengerCount, cartSize);

            // Create ride request data with proper PascalCase property names
            const rideRequestData = {
                RiderName: riderName,
                PickupLocation: pickupLocation,
                DropoffLocation: dropoffLocation,
                PassengerCount: passengerCount,
                CartSize: cartSize,
                EstimatedFare: parseFloat(fareEstimate.toFixed(2)) // Ensure proper decimal format
            };


            // Show loading modal
            this.showNotification('Requesting ride...', 'info');

            // Create ride request via API
            const rideRequest = await apiService.createRideRequest(rideRequestData);
            console.log('Created ride request:', rideRequest);
            
            if (rideRequest) {
                const rideId = rideRequest.Id || rideRequest.id;
                console.log('Using ride ID:', rideId);
                this.currentRideId = rideId;
                this.currentRideRequest = rideRequest;
                this.showFullScreenLoadingModal(rideId, rideRequest);
                this.startStatusPolling(rideId);
            }

        } catch (error) {
            console.error('Error confirming ride:', error);
            this.showNotification('Failed to request ride. Please try again.', 'danger');
        }
    }

    /**
     * Start polling for ride status updates
     */
    startStatusPolling(requestId) {
        console.log('Starting status polling for request ID:', requestId);
        
        this.statusPollingInterval = setInterval(async () => {
            try {
                console.log('Polling check...');
                await this.checkRideStatus(requestId);
            } catch (error) {
                console.error('Error checking ride status:', error);
            }
        }, 2000); // Check every 2 seconds

        // Set timeout for driver search
        this.driverSearchTimeout = setTimeout(() => {
            console.log('Driver search timeout reached (2 minutes)');
            this.showDriverSearchTimeout();
        }, 120000); // 2 minutes timeout - give drivers more time
        
        console.log('Status polling started, timeout set for 2 minutes');
    }

    /**
     * Stop status polling
     */
    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
        if (this.driverSearchTimeout) {
            clearTimeout(this.driverSearchTimeout);
            this.driverSearchTimeout = null;
        }
    }

    /**
     * Check ride status
     */
    async checkRideStatus(requestId) {
        try {
            console.log('Checking ride status for ID:', requestId);
            
            // Check if there's an active ride
            const activeRide = await apiService.getActiveRide();
            console.log('Active ride check result:', activeRide);
            
            if (activeRide && (activeRide.RideRequestId || activeRide.rideRequestId) === requestId) {
                // Driver accepted the ride
                console.log('Driver accepted ride!');
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                this.showNotification('Driver found! Redirecting to ride page...', 'success');
                
                // Redirect to active ride page
                setTimeout(() => {
                    window.location.href = `./active-ride.html?rideId=${activeRide.Id}`;
                }, 1000);
                return;
            }

            // Check if request still exists
            const requests = await apiService.getRideRequests();
            console.log('All pending requests:', requests);
            const ourRequest = requests.find(r => (r.Id || r.id) === requestId);
            console.log('Our request found:', ourRequest);
            
            if (!ourRequest) {
                // Request was removed (declined or cancelled)
                console.log('Request not found, stopping polling');
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                this.showNotification('No driver available. Please try again.', 'warning');
                return;
            }

        } catch (error) {
            console.error('Error checking ride status:', error);
        }
    }

    /**
     * Cancel ride request
     */
    async cancelRideRequest(requestId) {
        try {
            await apiService.deleteRideRequest(requestId);
            this.stopStatusPolling();
            this.hideFullScreenLoadingModal();
            this.hideAllModals(); // Clean up all modals
            this.showNotification('Ride request cancelled.', 'info');
        } catch (error) {
            console.error('Error cancelling ride request:', error);
            this.showNotification('Failed to cancel ride request.', 'danger');
        }
    }

    /**
     * Show full screen loading modal
     */
    showFullScreenLoadingModal(requestId, rideRequest) {
        // Remove any existing modal
        this.hideFullScreenLoadingModal();

        const modalHtml = `
            <div id="fullscreen-loading-modal" class="modal fade show" style="display: block; z-index: 9999;" tabindex="-1">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content" style="background: linear-gradient(135deg, #9E1B32 0%, #C41E3A 50%, #FFFFFF 100%); border: none;">
                        <div class="modal-body d-flex flex-column justify-content-center align-items-center text-center" style="min-height: 100vh;">
                            <div class="loading-content">
                                <div class="spinner-border text-white mb-4" style="width: 4rem; height: 4rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                
                                <h2 class="text-white mb-4">Searching for a Driver</h2>
                                
                                <div class="ride-details-card mb-4" style="background: rgba(255, 255, 255, 0.9); border-radius: 15px; padding: 2rem; max-width: 500px; width: 100%;">
                                    <h4 class="text-dark mb-3">Ride Details</h4>
                                    <div class="row text-start">
                                        <div class="col-6">
                                            <strong>From:</strong><br>
                                            <span class="text-muted">${rideRequest?.PickupLocation || 'Unknown'}</span>
                                        </div>
                                        <div class="col-6">
                                            <strong>To:</strong><br>
                                            <span class="text-muted">${rideRequest?.DropoffLocation || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="row text-start">
                                        <div class="col-6">
                                            <strong>Passengers:</strong><br>
                                            <span class="text-muted">${rideRequest?.PassengerCount || 1}</span>
                                        </div>
                                        <div class="col-6">
                                            <strong>Cart Size:</strong><br>
                                            <span class="text-muted">${rideRequest?.CartSize || 'Standard'}</span>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <strong>Estimated Fare:</strong><br>
                                        <span class="text-success fs-4">$${(rideRequest.EstimatedFare || 5.00).toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div class="progress mb-4" style="width: 300px; height: 8px;">
                                    <div class="progress-bar bg-white" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                
                                <p class="text-white mb-4">Please wait while we find the nearest available driver...</p>
                                
                                <button class="btn btn-outline-light btn-lg" onclick="riderInterface.cancelRideRequest(${requestId})">
                                    <i class="bi bi-x-circle me-2"></i>Cancel Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Animate progress bar
        this.animateProgressBar();
    }

    /**
     * Hide full screen loading modal
     */
    hideFullScreenLoadingModal() {
        const modal = document.getElementById('fullscreen-loading-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Show driver search timeout modal
     */
    showDriverSearchTimeout() {
        const modalHtml = `
            <div id="driver-timeout-modal" class="modal fade show" style="display: block; z-index: 10000;" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">No Driver Found</h5>
                        </div>
                        <div class="modal-body">
                            <p>We couldn't find an available driver within 2 minutes. Would you like to:</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="riderInterface.cancelRideRequest(${this.currentRideId})">
                                Cancel Request
                            </button>
                            <button type="button" class="btn btn-primary" onclick="riderInterface.keepSearching()">
                                Keep Searching
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        // Hide Bootstrap modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
        
        // Remove custom modals
        const customModals = document.querySelectorAll('#loading-modal, #driver-timeout-modal');
        customModals.forEach(modal => modal.remove());
    }

    /**
     * Keep searching for driver
     */
    keepSearching() {
        const modal = document.getElementById('driver-timeout-modal');
        if (modal) {
            modal.remove();
        }
        
        // Hide any other modals
        this.hideAllModals();
        
        // Restart the loading process
        if (this.currentRideId && this.currentRideRequest) {
            this.showFullScreenLoadingModal(this.currentRideId, this.currentRideRequest);
            this.startStatusPolling(this.currentRideId);
        } else {
            console.error('No current ride ID or request available for keep searching');
            this.showNotification('Unable to continue search. Please try again.', 'danger');
        }
    }

    /**
     * Calculate fare estimate
     */
    calculateFareEstimate(pickupLocation, dropoffLocation, passengerCount, cartSize) {
        
        if (!this.shortestPath) {
            return 5.00;
        }

        try {
            const route = this.shortestPath.findShortestPath(pickupLocation, dropoffLocation);
            if (!route || route.length === 0) return 5.00;

            const baseFare = 3.00;
            const perMinuteRate = 0.50;
            const estimatedTime = route.length * 2; // 2 minutes per segment
            const passengerMultiplier = passengerCount > 2 ? 1.2 : 1.0;
            const cartSizeMultiplier = cartSize === 'Large' ? 1.3 : 1.0;

            const fare = (baseFare + (estimatedTime * perMinuteRate)) * passengerMultiplier * cartSizeMultiplier;
            
            // Ensure we return a valid number
            const finalFare = isNaN(fare) ? 5.00 : fare;
            return finalFare;
        } catch (error) {
            console.error('Error calculating fare:', error);
            return 5.00;
        }
    }

    /**
     * Show ride confirmation modal
     */
    showRideConfirmation(rideData) {
        const modalHtml = `
            <div id="ride-confirmation-modal" class="modal fade show" style="display: block;" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Confirm Ride Request</h5>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>From:</strong><br>
                                    <span class="text-muted">${rideData.pickupLocation}</span>
                                </div>
                                <div class="col-6">
                                    <strong>To:</strong><br>
                                    <span class="text-muted">${rideData.dropoffLocation}</span>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Passengers:</strong><br>
                                    <span class="text-muted">${rideData.passengerCount}</span>
                                </div>
                                <div class="col-6">
                                    <strong>Cart Size:</strong><br>
                                    <span class="text-muted">${rideData.cartSize}</span>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <strong>Estimated Fare:</strong><br>
                                <span class="text-success fs-4">$${rideData.estimatedFare.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="riderInterface.confirmRide()">Confirm Ride</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * Animate progress bar
     */
    animateProgressBar() {
        const progressBar = document.querySelector('#fullscreen-loading-modal .progress-bar');
        if (!progressBar) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90; // Don't complete until driver found
            
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 1000);
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
                 style="top: 20px; right: 20px; z-index: 10000; min-width: 300px; background-color: ${type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : type === 'success' ? '#198754' : '#0dcaf0'}; color: ${type === 'warning' ? '#000' : '#fff'}; opacity: 1 !important;" role="alert">
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

    /**
     * Load user data
     */
    loadUserData() {
        // Load saved user preferences
        const savedName = localStorage.getItem('riderName');
        if (savedName) {
            const nameInput = document.getElementById('rider-name');
            if (nameInput) {
                nameInput.value = savedName;
            }
        }
    }

    /**
     * Update location display
     */
    updateLocationDisplay() {
        if (!this.locationServices) return;

        const locationDisplay = document.getElementById('current-location-display');
        if (locationDisplay) {
            this.locationServices.getCurrentLocation()
                .then(location => {
                    locationDisplay.textContent = `Current Location: ${location}`;
                })
                .catch(error => {
                    console.error('Error getting current location:', error);
                    locationDisplay.textContent = 'Current Location: Unknown';
                });
        }
    }

    /**
     * Populate location suggestions
     */
    populateLocationSuggestions() {
        if (!this.campusData) return;

        const pickupInput = document.getElementById('pickup-location');
        const dropoffInput = document.getElementById('dropoff-location');

        if (pickupInput) {
            this.setupLocationAutocomplete(pickupInput);
        }

        if (dropoffInput) {
            this.setupLocationAutocomplete(dropoffInput);
        }
    }

    /**
     * Setup location autocomplete
     */
    setupLocationAutocomplete(input) {
        if (!this.campusData) return;

        const locations = this.campusData.getLocations();
        
        input.addEventListener('input', () => {
            const value = input.value.toLowerCase();
            const matches = locations.filter(loc => 
                loc.toLowerCase().includes(value)
            );

            // Simple autocomplete implementation
            if (matches.length > 0 && value.length > 0) {
                input.setAttribute('list', 'location-suggestions');
                
                let datalist = document.getElementById('location-suggestions');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'location-suggestions';
                    document.body.appendChild(datalist);
                }

                datalist.innerHTML = matches.map(match => 
                    `<option value="${match}">`
                ).join('');
            }
        });
    }

    /**
     * Update fare estimate
     */
    updateFareEstimate() {
        const pickupLocation = document.getElementById('pickup-location')?.value?.trim();
        const dropoffLocation = document.getElementById('dropoff-location')?.value?.trim();
        const passengerCount = parseInt(document.getElementById('passenger-count')?.value) || 1;
        const cartSize = document.getElementById('cart-size')?.value || 'Standard';

        if (pickupLocation && dropoffLocation && pickupLocation !== dropoffLocation) {
            const fareEstimate = this.calculateFareEstimate(pickupLocation, dropoffLocation, passengerCount, cartSize);
            
            const fareDisplay = document.getElementById('fare-estimate-display');
            if (fareDisplay) {
                fareDisplay.textContent = `$${fareEstimate.toFixed(2)}`;
            }
        }
    }

    /**
     * Use current location
     */
    useCurrentLocation() {
        if (!this.locationServices) {
            this.showNotification('Location services not available.', 'warning');
            return;
        }

        this.locationServices.getCurrentLocation()
            .then(location => {
                const pickupInput = document.getElementById('pickup-location');
                if (pickupInput) {
                    pickupInput.value = location;
                    this.updateFareEstimate();
                }
                this.showNotification(`Set pickup location to: ${location}`, 'success');
            })
            .catch(error => {
                console.error('Error getting current location:', error);
                this.showNotification('Unable to get current location.', 'danger');
            });
    }

    /**
     * Update ride statistics
     */
    async updateRideStatistics() {
        try {
            const rideHistory = await apiService.getRideHistory();
            const totalRides = rideHistory.length;
            const totalSpent = rideHistory.reduce((sum, ride) => sum + ride.EstimatedFare, 0);

            const statsDisplay = document.getElementById('ride-stats-display');
            if (statsDisplay) {
                statsDisplay.innerHTML = `
                    <div class="row text-center">
                        <div class="col-6">
                            <h5 class="text-primary">${totalRides}</h5>
                            <small class="text-muted">Total Rides</small>
                        </div>
                        <div class="col-6">
                            <h5 class="text-success">$${totalSpent.toFixed(2)}</h5>
                            <small class="text-muted">Total Spent</small>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating ride statistics:', error);
        }
    }

    /**
     * Initialize map
     */
    initializeMap() {
        try {
            if (this.campusData && this.locationServices) {
                this.mapIntegration = new MapIntegration(this.campusData, this.locationServices);
                this.mapIntegration.initMap('rider-map');
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    /**
     * Track ride
     */
    trackRide() {
        this.showNotification('Ride tracking feature coming soon!', 'info');
    }

    /**
     * Cancel ride
     */
    cancelRide() {
        this.showNotification('Ride cancellation feature coming soon!', 'info');
    }
}

// Initialize rider interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure API service is loaded first
    if (typeof apiService === 'undefined') {
        console.error('ApiService not loaded! Check script loading order.');
        alert('ApiService not loaded! Please refresh the page.');
        return;
    }
    
    setTimeout(() => {
        if (typeof RiderInterface !== 'undefined') {
            window.riderInterface = new RiderInterface();
        } else {
            console.error('RiderInterface not loaded!');
        }
    }, 200);
});