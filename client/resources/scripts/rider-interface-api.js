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
        // Load available riders for login dropdown
        await this.loadRiderUsers();
        
        // Check localStorage for existing login
        const storedUser = localStorage.getItem('riderUser');
        const storedUserId = localStorage.getItem('riderUserId');
        const storedUserRole = localStorage.getItem('riderUserRole');
        
        if (storedUser && storedUserId && storedUserRole) {
            try {
                this.currentUser = JSON.parse(storedUser);
                apiService.currentUserId = parseInt(storedUserId);
                apiService.currentUserRole = storedUserRole;
                
                // Check if there's a pending ride
                const pendingRideId = localStorage.getItem('pendingRideId');
                if (pendingRideId) {
                    await this.loadPendingRideRequest(pendingRideId);
                } else {
                    // Check if there's an active ride for this rider
                    await this.checkForActiveRide();
                }
                return;
            } catch (error) {
                console.error('Error loading stored user data:', error);
                // Clear invalid session data
                localStorage.removeItem('riderUser');
                localStorage.removeItem('riderUserId');
                localStorage.removeItem('riderUserRole');
            }
        }
        
        // No valid session found, show login
            this.showLogin();
            await this.loadRiderUsers();
    }

    /**
     * Load pending ride request from localStorage
     */
    async loadPendingRideRequest(rideId) {
        try {
            const ride = await apiService.getRide(rideId);
            
            if (!ride) {
                // Ride no longer exists, clear session
                localStorage.removeItem('pendingRideId');
                this.showDashboard();
                this.loadRiderData();
                return;
            }
            
            if (ride.Status === 'Requested') {
                // Still requested, show waiting screen
                this.currentRideId = rideId;
                this.showDashboard();
                this.loadRiderData();
                this.showWaitingForDriverStatus(ride);
                this.startStatusPolling(rideId);
            } else if (ride.Status === 'In Progress') {
                // In progress, redirect to active ride
                localStorage.removeItem('pendingRideId');
                localStorage.setItem('activeRideId', ride.Id.toString());
                window.location.href = `./active-ride.html?rideId=${ride.Id}`;
            } else {
                // Completed or cancelled, clear session and show dashboard
                localStorage.removeItem('pendingRideId');
                this.showDashboard();
                this.loadRiderData();
            }
        } catch (error) {
            console.error('Error loading pending ride:', error);
            localStorage.removeItem('pendingRideId');
            this.showDashboard();
            this.loadRiderData();
        }
    }

    /**
     * Check for active ride when rider logs in
     */
    async checkForActiveRide() {
        try {
            const activeRide = await apiService.getCurrentRiderActiveRide();
            
            if (activeRide) {
                // Rider has an active ride, redirect to active ride page
                const rideId = activeRide.Id || activeRide.id;
                if (rideId) {
                    localStorage.setItem('activeRideId', rideId.toString());
                    window.location.href = `./active-ride.html?rideId=${rideId}`;
                } else {
                    console.error('Active ride found but no ID:', activeRide);
                    this.showDashboard();
                    this.loadRiderData();
                }
            } else {
                // No active ride, show dashboard
                this.showDashboard();
                this.loadRiderData();
            }
        } catch (error) {
            console.error('Error checking for active ride:', error);
            this.showDashboard();
            this.loadRiderData();
        }
    }

    async loadRiderUsers() {
        try {
            const riders = await apiService.getRiders();
            const riderSelect = document.getElementById('rider-select');
            
            if (riderSelect && riders) {
                // Clear existing options except the first one
                riderSelect.innerHTML = '<option value="">Select a rider...</option>';
                
                // Add rider options
                riders.forEach(rider => {
                    const option = document.createElement('option');
                    option.value = rider.UserId || rider.userId;
                    option.textContent = rider.Name || rider.name;
                    riderSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading riders:', error);
            this.showNotification('Failed to load rider accounts.', 'danger');
        }
    }

    async loginRider() {
        const selectedRider = document.getElementById('rider-select').value;

        if (!selectedRider) {
            this.showNotification('Please select a rider account.', 'warning');
            return;
        }

        try {
            // Get rider data from API instead of hardcoded values
            const userId = parseInt(selectedRider);
            const rider = await apiService.getRiderByUserId(userId);
            
            if (!rider) {
                this.showNotification('Rider not found.', 'error');
                return;
            }

            // Set up user data from API response
            const userData = {
                id: rider.UserId || rider.userId,
                username: rider.Name || rider.name, // Use rider name as username
                role: 'Rider', // Set role explicitly since we removed User include
                firstName: rider.Name || rider.name, // Use rider name as first name
                lastName: '', // No separate last name in rider data
                riderId: rider.Id || rider.id,
                riderName: rider.Name || rider.name,
                totalRides: rider.TotalRides || rider.totalRides,
                riderStatus: rider.RiderStatus || rider.riderStatus,
                averageRating: rider.AverageRating || rider.averageRating
            };

            this.currentUser = userData;
            
            apiService.currentUserId = userData.id;
            apiService.currentUserRole = userData.role;

            // Store user data in localStorage for persistence
            localStorage.setItem('riderUser', JSON.stringify(userData));
            localStorage.setItem('riderUserId', userData.id.toString());
            localStorage.setItem('riderUserRole', userData.role);

            this.showDashboard();
            this.loadRiderData();
            this.showNotification(`Welcome, ${userData.firstName}!`, 'success');
        } catch (error) {
            console.error('Error logging in rider:', error);
            this.showNotification('Login failed. Please try again.', 'danger');
        }
    }

    logout() {
        apiService.logout();
        this.currentUser = null;
        
        // Clear rider session from localStorage
        localStorage.removeItem('riderUser');
        localStorage.removeItem('riderUserId');
        localStorage.removeItem('riderUserRole');
        localStorage.removeItem('pendingRideRequestId');
        localStorage.removeItem('activeRideId');
        localStorage.removeItem('cachedLocation');
        
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
        // Update welcome message
        this.updateWelcomeMessage();
        
        // Get current location automatically
        this.getCurrentLocationOnLogin();
        
        // Update ride statistics
        this.updateRideStatistics();
        
        if (this.campusData && this.locationServices) {
            this.initializeInterface();
        }
    }

    async getCurrentLocationOnLogin() {
        // Check if we have a cached location first
        const cachedLocation = localStorage.getItem('cachedLocation');
        if (cachedLocation) {
            try {
                const locationData = JSON.parse(cachedLocation);
                const currentLocationElement = document.getElementById('current-location');
                if (currentLocationElement) {
                    currentLocationElement.textContent = locationData.nearestBuilding;
                }
                return;
            } catch (error) {
                localStorage.removeItem('cachedLocation');
            }
        }
        
        // No cached location, set default message
        const currentLocationElement = document.getElementById('current-location');
        if (currentLocationElement) {
            currentLocationElement.textContent = 'Click "Use Current Location" to set';
        }
    }

    updateWelcomeMessage() {
        const riderNameElement = document.getElementById('rider-name');
        if (riderNameElement && this.currentUser) {
            riderNameElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
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
            const passengerCount = parseInt(document.getElementById('passenger-count-select')?.value) || 1;
            const cartSize = this.getCartSizeFromPassengerCount(passengerCount);

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
            // Close the confirmation modal first
            this.cancelRideConfirmation();
            
            const pickupLocation = document.getElementById('pickup-location')?.value?.trim();
            const dropoffLocation = document.getElementById('dropoff-location')?.value?.trim();
            const passengerCount = parseInt(document.getElementById('passenger-count-select')?.value) || 2;
            const cartSize = this.getCartSizeFromPassengerCount(passengerCount);
            const riderName = document.getElementById('rider-name')?.textContent?.trim() || 'James Wilson';
            const specialNotes = document.getElementById('special-requests')?.value?.trim() || '';

            if (!pickupLocation || !dropoffLocation) {
                this.showNotification('Please select both pickup and dropoff locations.', 'warning');
                return;
            }

            // Calculate fare estimate
            const fareEstimate = this.calculateFareEstimate(pickupLocation, dropoffLocation, passengerCount, cartSize);

            // Create ride data
            const rideData = {
                RiderId: apiService.getCurrentRiderId(),
                RiderName: riderName,
                PickupLocation: pickupLocation,
                DropoffLocation: dropoffLocation,
                PassengerCount: passengerCount,
                CartSize: cartSize,
                SpecialNotes: specialNotes,
                EstimatedFare: parseFloat(fareEstimate.toFixed(2))
            };

            // Hide confirmation modal
            this.hideAllModals();

            // Show loading notification
            this.showNotification('Requesting ride...', 'info');

            // Create ride via API
            const ride = await apiService.createRide(rideData);
            
            if (ride) {
                // All rides start as "Requested" - show waiting status
                const rideId = ride.Id || ride.id;
                this.currentRideId = rideId;
                
                // Store rideId in localStorage for persistence
                localStorage.setItem('pendingRideId', rideId.toString());
                
                this.showWaitingForDriverStatus(ride);
                this.startStatusPolling(rideId);
            }

        } catch (error) {
            console.error('Error confirming ride:', error);
            this.showNotification('Failed to request ride. Please try again.', 'danger');
        }
    }

    /**
     * Get cart size based on passenger count
     */
    getCartSizeFromPassengerCount(passengerCount) {
        if (passengerCount <= 2) return 'Small';
        if (passengerCount <= 4) return 'Medium';
        if (passengerCount <= 6) return 'Large';
        return 'Extra Large';
    }

    /**
     * Show waiting for driver status
     */
    showWaitingForDriverStatus(rideRequest) {
        // Show notification that ride request was submitted
        this.showNotification('Ride request submitted! Waiting for driver...', 'success');
        
        // Show cancel button in a modal or notification
        this.showCancelRideModal(rideRequest);
    }

    /**
     * Show cancel ride modal
     */
    showCancelRideModal(rideRequest) {
        // Populate the modal with dynamic data
        document.getElementById('waiting-pickup').textContent = rideRequest.PickupLocation || rideRequest.pickupLocation || 'Unknown';
        document.getElementById('waiting-dropoff').textContent = rideRequest.DropoffLocation || rideRequest.dropoffLocation || 'Unknown';
        document.getElementById('waiting-passengers').textContent = rideRequest.PassengerCount || rideRequest.passengerCount || 2;
        document.getElementById('waiting-fare').textContent = `$${(rideRequest.EstimatedFare || rideRequest.estimatedFare || 0).toFixed(2)}`;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cancelRideModal'));
        modal.show();
    }

    /**
     * Cancel pending ride request
     */
    async cancelPendingRide() {
        if (!this.currentRideId) {
            this.showNotification('No pending ride to cancel.', 'warning');
            return;
        }

        try {
            // Show confirmation dialog
            const confirmed = confirm('Are you sure you want to cancel this ride request?');
            if (!confirmed) return;

            // Cancel the ride
            await apiService.cancelRide(this.currentRideId);
            
            // Clear session storage
            localStorage.removeItem('pendingRideId');
            
            // Close modal and reset UI
            const modal = document.getElementById('cancelRideModal');
            if (modal) {
                const bootstrapModal = bootstrap.Modal.getInstance(modal);
                if (bootstrapModal) {
                    bootstrapModal.hide();
                }
                modal.remove();
            }
            this.currentRideId = null;
            
            // Stop polling
            if (this.statusPollingInterval) {
                clearInterval(this.statusPollingInterval);
                this.statusPollingInterval = null;
            }
            
            this.showNotification('Ride request cancelled.', 'success');
            
        } catch (error) {
            console.error('Error cancelling ride request:', error);
            this.showNotification('Failed to cancel ride request. Please try again.', 'danger');
        }
    }

    /**
     * Start polling for ride status updates
     */
    startStatusPolling(rideId) {
        
        this.statusPollingInterval = setInterval(async () => {
            try {
                await this.checkRideStatus(rideId);
            } catch (error) {
                console.error('Error checking ride status:', error);
            }
        }, 2000); // Check every 2 seconds

        // No timeout - wait forever for a driver
        
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
     * Check ride status by polling GET /api/rides/{id}
     */
    async checkRideStatus(rideId) {
        try {
            
            // Get the specific ride
            const ride = await apiService.getRide(rideId);
            
            if (!ride) {
                // Ride was removed (cancelled)
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                this.showNotification('Ride was cancelled. Please try again.', 'warning');
                return;
            }

            if (ride.Status === "In Progress") {
                // Driver accepted the ride
                this.stopStatusPolling();
                this.hideRideStatusCard();
                
                // Clear pending ride and set active ride
                localStorage.removeItem('pendingRideId');
                localStorage.setItem('activeRideId', ride.Id.toString());
                
                this.showNotification('Driver found! Redirecting to ride page...', 'success');
                
                // Redirect to active ride page
                setTimeout(() => {
                    window.location.href = `./active-ride.html?rideId=${ride.Id}`;
                }, 1000);
            } else if (ride.Status === "Cancelled") {
                // Ride was cancelled
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                this.showNotification('Ride was cancelled.', 'info');
                localStorage.removeItem('pendingRideId');
            }
            // If status is still "Requested", continue polling

        } catch (error) {
            console.error('Error checking ride status:', error);
        }
    }

    /**
     * Cancel ride
     */
    async cancelRide(rideId) {
        try {
            await apiService.cancelRide(rideId);
            this.stopStatusPolling();
            this.hideFullScreenLoadingModal();
            this.hideAllModals(); // Clean up all modals
            this.showNotification('Ride cancelled.', 'info');
            localStorage.removeItem('pendingRideId');
        } catch (error) {
            console.error('Error cancelling ride:', error);
            this.showNotification('Failed to cancel ride.', 'danger');
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
                                            <span class="text-muted">${rideRequest?.PassengerCount || 2}</span>
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

    hideRideStatusCard() {
        // Method no longer needed - ride status is handled by modal
        // Close any open modals
        const modal = document.getElementById('cancelRideModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
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
        // Simple fare calculation: $7 per passenger
        const farePerPassenger = 7.00;
        const totalFare = farePerPassenger * passengerCount;
        
        return totalFare;
    }

    /**
     * Show ride confirmation modal
     */
    showRideConfirmation(rideData) {
        // Get modal elements
        const modalPickup = document.getElementById('modal-pickup');
        const modalDropoff = document.getElementById('modal-dropoff');
        const modalPassengerCount = document.getElementById('modal-passenger-count');
        const modalCartSize = document.getElementById('modal-cart-size');
        const modalEstimatedFare = document.getElementById('modal-estimated-fare');
        
        // Check if elements exist
        if (!modalPickup || !modalDropoff || !modalPassengerCount || !modalCartSize || !modalEstimatedFare) {
            console.error('Modal elements not found!');
            return;
        }
        
        // Populate the modal with dynamic data
        modalPickup.textContent = rideData.pickupLocation;
        modalDropoff.textContent = rideData.dropoffLocation;
        modalPassengerCount.textContent = rideData.passengerCount;
        modalCartSize.textContent = rideData.cartSize;
        modalEstimatedFare.textContent = `$${rideData.estimatedFare.toFixed(2)}`;

        // Use setTimeout to ensure DOM is updated before showing modal
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('ride-confirmation-modal'));
            modal.show();
        }, 10);
    }

    /**
     * Cancel ride confirmation modal
     */
    cancelRideConfirmation() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('ride-confirmation-modal'));
        if (modal) {
            modal.hide();
        }
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
        const pickupInput = document.getElementById('pickup-location');
        const dropoffInput = document.getElementById('dropoff-location');

        [pickupInput, dropoffInput].forEach(input => {
            if (input) {
                // Enhanced event listeners
                input.addEventListener('input', (e) => {
                    this.handleLocationInput(e.target);
                });

                input.addEventListener('focus', (e) => {
                    this.handleLocationFocus(e.target);
                });

                input.addEventListener('blur', (e) => {
                    this.handleLocationBlur(e.target);
                });

                input.addEventListener('keydown', (e) => {
                    this.handleLocationKeydown(e);
                });

                // Initialize popular locations
                this.populatePopularLocations(input);
            }
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.location-input-container')) {
                this.closeAllDropdowns();
            }
        });
    }

    /**
     * Handle location input for autocomplete
     * @param {HTMLElement} input - Input element
     */
    handleLocationInput(input) {
        const value = input.value.trim();
        const suggestionsContainer = this.getSuggestionsContainer(input);
        const popularContainer = this.getPopularContainer(input);
        
        // Hide popular locations when typing
        popularContainer.classList.remove('show');
        
        if (value.length < 1) {
            suggestionsContainer.classList.remove('show');
            this.updateValidationIcon(input, 'neutral');
            return;
        }

        const suggestions = this.locationServices.getLocationSuggestions(value);
        this.showLocationSuggestions(input, suggestions);
        this.updateValidationIcon(input, suggestions.length > 0 ? 'valid' : 'invalid');
    }

    /**
     * Handle location focus
     * @param {HTMLElement} input - Input element
     */
    handleLocationFocus(input) {
        const popularContainer = this.getPopularContainer(input);
        const suggestionsContainer = this.getSuggestionsContainer(input);
        
        // Always show popular locations when focused (regardless of existing text)
        popularContainer.classList.add('show');
        
        // Hide other dropdowns
        this.closeOtherDropdowns(input);
    }

    /**
     * Handle location blur
     * @param {HTMLElement} input - Input element
     */
    handleLocationBlur(input) {
        // Delay to allow click events on suggestions
        setTimeout(() => {
            this.validateLocationInput(input);
            this.closeDropdown(input);
        }, 150);
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleLocationKeydown(e) {
        const input = e.target;
        const suggestionsContainer = this.getSuggestionsContainer(input);
        
        if (!suggestionsContainer.classList.contains('show')) return;
        
        const suggestions = suggestionsContainer.querySelectorAll('.location-suggestion-item');
        const selected = suggestionsContainer.querySelector('.location-suggestion-item.selected');
        let currentIndex = -1;
        
        if (selected) {
            currentIndex = Array.from(suggestions).indexOf(selected);
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, suggestions.length - 1);
                this.selectSuggestion(suggestions[currentIndex]);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, 0);
                this.selectSuggestion(suggestions[currentIndex]);
                break;
            case 'Enter':
                e.preventDefault();
                if (selected) {
                    this.selectLocationFromSuggestion(input, selected);
                }
                break;
            case 'Escape':
                this.closeDropdown(input);
                input.blur();
                break;
        }
    }

    /**
     * Show location suggestions
     * @param {HTMLElement} input - Input element
     * @param {Array} suggestions - Array of suggestion strings
     */
    showLocationSuggestions(input, suggestions) {
        const suggestionsContainer = this.getSuggestionsContainer(input);
        
        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsContainer.classList.remove('show');
            return;
        }

        // Create suggestion items
        suggestions.forEach(suggestion => {
            const locationData = this.campusData.getLocationCoordinates(suggestion);
            const suggestionItem = this.createSuggestionItem(suggestion, locationData);
            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.classList.add('show');
    }

    /**
     * Create a suggestion item
     * @param {string} locationName - Location name
     * @param {Object} locationData - Location data
     * @returns {HTMLElement} Suggestion item element
     */
    createSuggestionItem(locationName, locationData) {
        const item = document.createElement('div');
        item.className = 'location-suggestion-item';
        item.setAttribute('role', 'option');
        
        const icon = this.getBuildingTypeIcon(locationData.type);
        const iconElement = document.createElement('div');
        iconElement.className = `location-suggestion-icon ${locationData.type}`;
        iconElement.innerHTML = icon;
        
        const content = document.createElement('div');
        content.className = 'location-suggestion-content';
        content.innerHTML = `
            <div class="location-suggestion-name">${locationName}</div>
            <div class="location-suggestion-type">${locationData.type}</div>
        `;
        
        item.appendChild(iconElement);
        item.appendChild(content);
        
        item.addEventListener('click', () => {
            this.selectLocationFromSuggestion(item.closest('.location-input-container').querySelector('input'), item);
        });
        
        item.addEventListener('mouseenter', () => {
            this.selectSuggestion(item);
        });
        
        return item;
    }

    /**
     * Get building type icon
     * @param {string} type - Building type
     * @returns {string} Icon HTML
     */
    getBuildingTypeIcon(type) {
        // Add default fallback
        if (!type) {
            console.warn('Building type is null/undefined, using default');
            type = 'academic'; // Default fallback
        }
        
        const icons = {
            'academic': '<i class="bi bi-mortarboard"></i>',
            'residential': '<i class="bi bi-house"></i>',
            'dining': '<i class="bi bi-cup-hot"></i>',
            'recreation': '<i class="bi bi-trophy"></i>',
            'parking': '<i class="bi bi-p-square"></i>',
            'hub': '<i class="bi bi-building"></i>',
            'landmark': '<i class="bi bi-geo-alt"></i>'
        };
        return icons[type] || '<i class="bi bi-geo-alt"></i>'; // Fallback icon
    }

    /**
     * Select a suggestion item
     * @param {HTMLElement} item - Suggestion item
     */
    selectSuggestion(item) {
        const container = item.closest('.location-suggestions');
        container.querySelectorAll('.location-suggestion-item').forEach(i => {
            i.classList.remove('selected');
        });
        item.classList.add('selected');
    }

    /**
     * Select location from suggestion
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} suggestionItem - Suggestion item
     */
    selectLocationFromSuggestion(input, suggestionItem) {
        const locationName = suggestionItem.querySelector('.location-suggestion-name').textContent;
        input.value = locationName;
        this.validateLocationInput(input);
        this.closeDropdown(input);
        
        // Update map if available
        if (this.mapIntegration && input.id === 'pickup-location') {
            const locationData = this.campusData.getLocationCoordinates(locationName);
            if (locationData) {
                this.mapIntegration.setPickupFromCoords(locationData.lat, locationData.lng, locationName);
            }
        } else if (this.mapIntegration && input.id === 'dropoff-location') {
            const locationData = this.campusData.getLocationCoordinates(locationName);
            if (locationData) {
                this.mapIntegration.setDropoffFromCoords(locationData.lat, locationData.lng, locationName);
            }
        }
    }

    /**
     * Validate location input with enhanced feedback
     * @param {HTMLElement} input - Input element
     */
    validateLocationInput(input) {
        const value = input.value.trim();
        
        // Clear previous validation states
        input.classList.remove('is-valid', 'is-invalid');
        
        if (value.length === 0) {
            // Empty input - neutral state
            this.updateValidationIcon(input, 'neutral');
            return;
        }
        
        // Check if location exists in campus data
        const isValid = this.locationServices.isValidLocation(value);
        const locationData = this.campusData.getLocationCoordinates(value);
        
        if (isValid && locationData) {
            // Valid location found
            input.classList.add('is-valid');
            this.updateValidationIcon(input, 'valid');
            
            // Update map if available
            if (this.mapIntegration && this.mapIntegration.initialized) {
                const isPickup = input.id === 'pickup-location';
                if (isPickup) {
                    this.mapIntegration.setPickupLocation(value, locationData.lat, locationData.lng);
                } else {
                    this.mapIntegration.setDropoffLocation(value, locationData.lat, locationData.lng);
                }
            }
        } else {
            // Invalid location
            input.classList.add('is-invalid');
            this.updateValidationIcon(input, 'invalid');
            
            // Show helpful error message
            this.showLocationError(input, value);
        }
    }

    /**
     * Show location error message
     * @param {HTMLElement} input - Input element
     * @param {string} value - Input value
     */
    showLocationError(input, value) {
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.location-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'location-error-message text-danger small mt-1';
        
        // Get suggestions for similar locations
        const suggestions = this.campusData.getLocationSuggestions(value);
        if (suggestions.length > 0) {
            errorDiv.innerHTML = `
                <i class="bi bi-exclamation-triangle me-1"></i>
                Location not found. Did you mean: 
                <strong>${suggestions.slice(0, 2).join('</strong> or <strong>')}</strong>?
            `;
        } else {
            errorDiv.innerHTML = `
                <i class="bi bi-exclamation-triangle me-1"></i>
                Location not found. Please select from available campus locations.
            `;
        }
        
        input.parentNode.appendChild(errorDiv);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Update validation icon
     * @param {HTMLElement} input - Input element
     * @param {string} state - Validation state (valid, invalid, neutral)
     */
    updateValidationIcon(input, state) {
        const icon = input.parentNode.querySelector('.input-validation-icon');
        if (icon) {
            icon.className = `input-validation-icon ${state}`;
            icon.innerHTML = state === 'valid' ? '<i class="bi bi-check-circle-fill"></i>' : 
                           state === 'invalid' ? '<i class="bi bi-x-circle-fill"></i>' : 
                           '<i class="bi bi-circle"></i>';
        }
    }

    /**
     * Populate popular locations
     * @param {HTMLElement} input - Input element
     */
    populatePopularLocations(input) {
        const popularContainer = this.getPopularContainer(input);
        const chipsContainer = popularContainer.querySelector('.popular-chips');
        
        
        // Define comprehensive list of popular campus locations
        const popularLocationNames = [
            'Ferguson Student Center',
            'Gorgas Library', 
            'Student Recreation Center',
            'Tutwiler Hall',
            'Burke Dining Hall',
            'Ten Hoor Hall',
            'Ridgecrest South',
            'Bryant-Denny Stadium',
            'Hewson Hall',
            'Presidential Village',
            'Bidgood Hall',
            'Lakeside Dining Hall',
            'Ridgecrest North',
            'Paty Hall',
            'Manly Hall',
            'Lloyd Hall',
            'Smith Hall',
            'Morgan Hall',
            'Clark Hall',
            'Rowand-Johnson Hall'
        ];
        
        // Create chips for popular locations
        popularLocationNames.slice(0, 8).forEach(locationName => {
            const locationData = this.campusData.getLocationCoordinates(locationName);
            
            // Add null check here
            if (!locationData) {
                console.warn(`Location "${locationName}" not found in campus data`);
                return; // Skip this location
            }
            
            const chip = document.createElement('div');
            chip.className = 'popular-chip';
            
            // Safer icon handling
            const iconHtml = this.getBuildingTypeIcon(locationData.type);
            const iconClass = iconHtml.match(/class="([^"]+)"/);
            const iconClassName = iconClass ? iconClass[1] : 'bi-geo-alt';
            
            chip.innerHTML = `
                <i class="${iconClassName}"></i>
                ${locationName}
            `;
            
            chip.addEventListener('click', () => {
                // Replace existing content with new location
                input.value = locationName;
                input.classList.add('is-valid');
                this.validateLocationInput(input);
                this.closeDropdown(input);
                
                // Update map markers (this will replace existing markers)
                if (this.mapIntegration && input.id === 'pickup-location') {
                    this.mapIntegration.setPickupFromCoords(locationData.lat, locationData.lng, locationName);
                } else if (this.mapIntegration && input.id === 'dropoff-location') {
                    this.mapIntegration.setDropoffFromCoords(locationData.lat, locationData.lng, locationName);
                }
                
                // Update fare estimate after location change
                this.updateFareEstimate();
                
            });
            
            chipsContainer.appendChild(chip);
        });
    }

    /**
     * Get suggestions container for input
     * @param {HTMLElement} input - Input element
     * @returns {HTMLElement} Suggestions container
     */
    getSuggestionsContainer(input) {
        return input.closest('.location-input-container').querySelector('.location-suggestions');
    }

    /**
     * Get popular locations container for input
     * @param {HTMLElement} input - Input element
     * @returns {HTMLElement} Popular locations container
     */
    getPopularContainer(input) {
        return input.closest('.location-input-container').querySelector('.popular-locations');
    }

    /**
     * Close dropdown for specific input
     * @param {HTMLElement} input - Input element
     */
    closeDropdown(input) {
        const suggestionsContainer = this.getSuggestionsContainer(input);
        const popularContainer = this.getPopularContainer(input);
        
        suggestionsContainer.classList.remove('show');
        popularContainer.classList.remove('show');
    }

    /**
     * Close other dropdowns except for the specified input
     * @param {HTMLElement} currentInput - Current input element
     */
    closeOtherDropdowns(currentInput) {
        const allInputs = document.querySelectorAll('#pickup-location, #dropoff-location');
        allInputs.forEach(input => {
            if (input !== currentInput) {
                this.closeDropdown(input);
            }
        });
    }

    /**
     * Close all dropdowns
     */
    closeAllDropdowns() {
        const allInputs = document.querySelectorAll('#pickup-location, #dropoff-location');
        allInputs.forEach(input => {
            this.closeDropdown(input);
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
     * Use current GPS location
     */
    async useCurrentLocation() {
        try {
            // Always get fresh GPS location when button is clicked
            const locationData = await this.locationServices.getCurrentLocationWithBuilding();
            
            // Cache the fresh location data for future page loads
            localStorage.setItem('cachedLocation', JSON.stringify(locationData));
            
            // Set pickup location
                const pickupInput = document.getElementById('pickup-location');
            pickupInput.value = locationData.nearestBuilding;
            pickupInput.classList.add('is-valid');
            
            // Update current location display
            const currentLocationElement = document.getElementById('current-location');
            if (currentLocationElement) {
                currentLocationElement.textContent = locationData.nearestBuilding;
            }
            
            // Update map if available
            if (this.mapIntegration) {
                this.mapIntegration.setPickupFromCoords(
                    locationData.lat, 
                    locationData.lng, 
                    locationData.nearestBuilding
                );
            }
            
            let message, notificationType;
            
            if (locationData.isOnCampus) {
                message = `Location set to ${locationData.nearestBuilding}`;
                notificationType = 'success';
            } else if (locationData.isFarFromCampus) {
                message = `You're ${locationData.distanceToCampus.toFixed(1)}km from campus. Default set to ${locationData.nearestBuilding}`;
                notificationType = 'warning';
            } else {
                message = `Location set to ${locationData.nearestBuilding} (nearest campus building)`;
                notificationType = 'info';
            }
            
            this.showNotification(message, notificationType);
            
        } catch (error) {
            this.showNotification('Could not get current location. Please try again.', 'warning');
        }
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

            // Update the main total rides display
            const totalRidesElement = document.getElementById('total-rides');
            if (totalRidesElement) {
                totalRidesElement.textContent = totalRides;
            }

            // Update ride history list
            this.updateRideHistoryList(rideHistory);
            
            // Update VIP progress
            this.updateVipProgress(totalRides);
        } catch (error) {
            console.error('Error updating ride statistics:', error);
            
            // Show welcome message for new riders when API fails
            this.updateRideHistoryList([]);
            
            // Set default stats
            const statsDisplay = document.getElementById('ride-stats-display');
            if (statsDisplay) {
                statsDisplay.innerHTML = `
                    <div class="row text-center">
                        <div class="col-6">
                            <h5 class="text-primary">0</h5>
                            <small class="text-muted">Total Rides</small>
                        </div>
                        <div class="col-6">
                            <h5 class="text-success">$0.00</h5>
                            <small class="text-muted">Total Spent</small>
                        </div>
                    </div>
                `;
            }
            
            // Update the main total rides display to 0
            const totalRidesElement = document.getElementById('total-rides');
            if (totalRidesElement) {
                totalRidesElement.textContent = '0';
            }
            
            // Update VIP progress for new riders
            this.updateVipProgress(0);
        }
    }

    /**
     * Update VIP progress bar based on ride count with tiered system
     */
    updateVipProgress(totalRides) {
        const progressBar = document.getElementById('ride-progress-bar');
        const progressText = document.getElementById('vip-progress-text');
        
        if (!progressBar || !progressText) return;
        
        if (totalRides >= 20) {
            // VIP Rider (20+ rides)
            progressBar.style.width = '100%';
            progressBar.classList.remove('bg-success', 'bg-primary');
            progressBar.classList.add('bg-warning');
            progressText.textContent = '🎉 VIP Rider Status Achieved!';
        } else if (totalRides >= 10) {
            // Regular Rider (10-19 rides)
            const progress = ((totalRides - 10) / 10) * 100; // Progress within regular tier
            const ridesNeeded = 20 - totalRides;
            
            progressBar.style.width = `${progress}%`;
            progressBar.classList.remove('bg-success', 'bg-warning');
            progressBar.classList.add('bg-primary');
            progressText.textContent = `${ridesNeeded} rides to VIP Rider`;
        } else {
            // New Rider (0-9 rides)
            const progress = (totalRides / 10) * 100; // Progress within new rider tier
            const ridesNeeded = 10 - totalRides;
            
            progressBar.style.width = `${progress}%`;
            progressBar.classList.remove('bg-primary', 'bg-warning');
            progressBar.classList.add('bg-success');
            progressText.textContent = `${ridesNeeded} rides to Regular Rider`;
        }
    }

    /**
     * Update ride history list with actual data
     */
    updateRideHistoryList(rideHistory) {
        const rideHistoryContainer = document.getElementById('ride-history-list');
        if (!rideHistoryContainer) {
            return;
        }

        if (rideHistory.length === 0) {
            rideHistoryContainer.innerHTML = `
                <div class="list-group-item border-0 px-0 text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-emoji-smile fs-1 mb-3 text-success"></i>
                        <h5 class="mb-2 text-success">Welcome to Tide Rides!</h5>
                        <p class="mb-2">You're all set to start your first ride.</p>
                        <small>Your completed rides will appear here after your first trip.</small>
                    </div>
                </div>
            `;
            return;
        }

        // Sort rides by date (most recent first)
        const sortedRides = rideHistory.sort((a, b) => {
            const aTime = new Date(a.EndTime || a.endTime || a.StartTime || a.startTime);
            const bTime = new Date(b.EndTime || b.endTime || b.StartTime || b.startTime);
            return bTime - aTime;
        });

        // Show only the 3 most recent rides
        const recentRides = sortedRides.slice(0, 3);

        rideHistoryContainer.innerHTML = recentRides.map(ride => {
            const startTime = new Date(ride.StartTime || ride.startTime);
            const endTime = (ride.EndTime || ride.endTime) ? new Date(ride.EndTime || ride.endTime) : null;
            const displayTime = endTime || startTime;
            
            // Format date and time
            const timeAgo = this.getTimeAgo(displayTime);
            const pickupLocation = ride.PickupLocation || ride.pickupLocation || 'Unknown';
            const dropoffLocation = ride.DropoffLocation || ride.dropoffLocation || 'Unknown';
            const route = `${pickupLocation} → ${dropoffLocation}`;
            
            return `
                <div class="list-group-item border-0 px-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1 fw-bold">${route}</h6>
                            <small class="text-muted">${timeAgo}</small>
                        </div>
                        <span class="badge bg-success">Completed</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get time ago string for display
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
        const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffYears > 0) {
            return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
        } else if (diffWeeks > 0) {
            return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    /**
     * Initialize map
     */
    initializeMap() {
        try {
            if (this.campusData && this.locationServices) {
                this.mapIntegration = new MapIntegration(this.campusData, this.locationServices);
                this.mapIntegration.initMap('campus-map');
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    /**
     * Track ride - redirect to active ride page
     */
    trackRide() {
        if (this.currentRideId) {
            window.location.href = `active-ride.html?rideId=${this.currentRideId}`;
        } else {
            this.showNotification('No active ride to track.', 'warning');
        }
    }

    /**
     * Cancel ride
     */
    async cancelRide() {
        if (!this.currentRideId) {
            this.showNotification('No active ride to cancel.', 'warning');
            return;
        }

        try {
            // Show confirmation dialog
            const confirmed = confirm('Are you sure you want to cancel this ride?');
            if (!confirmed) return;

            // Cancel the ride request
            await this.cancelRideRequest(this.currentRideId);
            
            // Reset UI
            this.hideRideStatusCard();
            this.currentRideId = null;
            this.currentRide = null;
            
            // Stop polling
            if (this.statusPollingInterval) {
                clearInterval(this.statusPollingInterval);
                this.statusPollingInterval = null;
            }
            
            this.showNotification('Ride cancelled successfully.', 'success');
            
        } catch (error) {
            console.error('Error cancelling ride:', error);
            this.showNotification('Failed to cancel ride. Please try again.', 'danger');
        }
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