/**
 * Rider Interface Module for Tide Rides
 * Enhanced functionality for ride requests and real-time updates
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

        // Check for AppState availability
        if (typeof appState === 'undefined') {
            console.warn('AppState not available. Some features may not work properly.');
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
        this.rideHistory = this.loadRideHistory();
        this.locationWatchId = null;
        this.statusPollingInterval = null; // For checking ride status
        
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
        
        setTimeout(() => {
            this.initializeMap();
        }, 100);
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

        // Location input autocomplete
        this.setupLocationAutocomplete();

        // Passenger count controls
        this.setupPassengerCountControls();
    }

    /**
     * Setup passenger count controls
     */
    setupPassengerCountControls() {
        const selectElement = document.getElementById('passenger-count-select');
        
        if (selectElement) {
            selectElement.addEventListener('change', () => {
                const value = parseInt(selectElement.value);
                this.updatePassengerCountDisplay(value);
            });
        }
        
        // Initialize display
        this.updatePassengerCountDisplay(2);
    }

    /**
     * Update passenger count display and cart size info
     * @param {number} count - Number of passengers
     */
    updatePassengerCountDisplay(count) {
        const cartInfo = this.campusData.getCartSizeRecommendation(count);
        const cartSizeInfo = document.getElementById('cart-size-info');
        const cartSizeText = document.getElementById('cart-size-text');
        
        if (cartSizeInfo && cartSizeText) {
            cartSizeText.textContent = `${cartInfo.size} Golf Cart (${cartInfo.capacity})`;
            cartSizeInfo.style.display = 'block';
        }
        
        // Update fare estimate
        this.updateFareEstimate();
    }

    /**
     * Get current passenger count
     * @returns {number} Number of passengers
     */
    getPassengerCount() {
        const selectElement = document.getElementById('passenger-count-select');
        
        if (selectElement) {
            return parseInt(selectElement.value) || 2;
        }
        
        return 2; // Default
    }

    /**
     * Setup location input autocomplete
     */
    setupLocationAutocomplete() {
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
        
        // Show popular locations when focused and empty
        if (!input.value.trim()) {
            popularContainer.classList.add('show');
        }
        
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
        
        // Get popular locations from campus data
        const popularRoutes = this.campusData.getPopularRoutes();
        const popularLocations = new Set();
        
        popularRoutes.forEach(route => {
            popularLocations.add(route.from);
            popularLocations.add(route.to);
        });
        
        // Create chips for popular locations
        Array.from(popularLocations).slice(0, 6).forEach(locationName => {
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
                input.value = locationName;
                this.validateLocationInput(input);
                this.closeDropdown(input);
                
                // Update map if available
                if (this.mapIntegration && input.id === 'pickup-location') {
                    this.mapIntegration.setPickupFromCoords(locationData.lat, locationData.lng, locationName);
                } else if (this.mapIntegration && input.id === 'dropoff-location') {
                    this.mapIntegration.setDropoffFromCoords(locationData.lat, locationData.lng, locationName);
                }
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
     * Handle ride request
     */
    async handleRideRequest() {
        try {
            // Validate form
            const pickup = document.getElementById('pickup-location').value.trim();
            const dropoff = document.getElementById('dropoff-location').value.trim();
            const passengerCount = this.getPassengerCount();

            if (!pickup || !dropoff) {
                this.showNotification('Please fill in both pickup and dropoff locations', 'warning');
                return;
            }

            if (!this.locationServices.isValidLocation(pickup)) {
                this.showNotification(`Invalid pickup location: ${pickup}`, 'danger');
                return;
            }

            if (!this.locationServices.isValidLocation(dropoff)) {
                this.showNotification(`Invalid dropoff location: ${dropoff}`, 'danger');
                return;
            }

            if (pickup === dropoff) {
                this.showNotification('Pickup and dropoff locations cannot be the same', 'warning');
                return;
            }

            // Validate route
            const routeValidation = this.shortestPath.validateRoute(pickup, dropoff);
            if (!routeValidation.valid) {
                this.showNotification(`Route validation failed: ${routeValidation.errors.join(', ')}`, 'danger');
                return;
            }

            // Find closest driver for ETA estimation
            const closestDriver = this.shortestPath.findClosestDriver(pickup);
            let estimatedDriverArrival = null;
            
            if (closestDriver) {
                estimatedDriverArrival = closestDriver.estimatedArrival;
            }

            // Calculate fare
            const fareCalculation = this.shortestPath.calculateFare(pickup, dropoff, passengerCount);
            
            // Update modal with calculated data and driver ETA
            this.updateRideConfirmationModal(pickup, dropoff, passengerCount, fareCalculation, estimatedDriverArrival);
            
            // Show confirmation modal
            const modal = new bootstrap.Modal(document.getElementById('rideConfirmationModal'));
            modal.show();

        } catch (error) {
            console.error('Ride request error:', error);
            this.showNotification('Error processing ride request. Please try again.', 'danger');
        }
    }

    /**
     * Update ride confirmation modal
     * @param {string} pickup - Pickup location
     * @param {string} dropoff - Dropoff location
     * @param {number} passengerCount - Number of passengers
     * @param {Object} fareCalculation - Fare calculation result
     * @param {number|null} estimatedDriverArrival - Estimated driver arrival time in minutes
     */
    updateRideConfirmationModal(pickup, dropoff, passengerCount, fareCalculation, estimatedDriverArrival) {
        document.getElementById('modal-pickup').textContent = pickup;
        document.getElementById('modal-dropoff').textContent = dropoff;
        document.getElementById('modal-passenger-count').textContent = passengerCount;
        document.getElementById('modal-cart-size').textContent = fareCalculation.cartSize;
        document.getElementById('estimated-fare').textContent = `$${fareCalculation.totalFare.toFixed(2)}`;
        
        // Update driver ETA if available
        const etaElement = document.getElementById('driver-eta');
        const etaSection = document.getElementById('driver-eta-section');
        
        if (etaElement && etaSection) {
            if (estimatedDriverArrival !== null) {
                etaElement.textContent = `${estimatedDriverArrival} minutes`;
                etaSection.style.display = 'block';
            } else {
                etaSection.style.display = 'none';
            }
        }
    }

    /**
     * Confirm ride request
     */
    async confirmRide() {
        try {
            const pickup = document.getElementById('modal-pickup').textContent;
            const dropoff = document.getElementById('modal-dropoff').textContent;
            const passengerCount = parseInt(document.getElementById('modal-passenger-count').textContent);
            const riderName = document.getElementById('rider-name').textContent || 'Anonymous Rider';

            // Check if AppState is available
            if (typeof appState === 'undefined') {
                console.error('AppState is undefined in confirmRide method');
                this.showNotification('System unavailable. Please refresh the page and try again.', 'danger');
                return;
            }

            // Create ride request object
            const rideRequest = {
                riderName: riderName,
                pickupLocation: pickup,
                dropoffLocation: dropoff,
                passengerCount: passengerCount,
                cartSize: document.getElementById('modal-cart-size').textContent,
                estimatedFare: this.shortestPath.calculateFare(pickup, dropoff, passengerCount).totalFare,
                status: 'pending'
            };

            // Add ride request to shared state
            const requestId = appState.addRideRequest(rideRequest);

            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('rideConfirmationModal'));
            modal.hide();

            // Show success notification
            this.showNotification('Ride request submitted successfully! Searching for a driver...', 'success');

            // Show full-screen loading modal
            this.showFullScreenLoadingModal(requestId, rideRequest);
            
            // Start polling for driver assignment
            this.startStatusPolling();

        } catch (error) {
            console.error('Ride confirmation error:', error);
            this.showNotification('Error confirming ride. Please try again.', 'danger');
        }
    }

    /**
     * Check ride status for driver assignment
     * @private
     */
    _checkRideStatus() {
        if (typeof appState === 'undefined' || !this.currentRequestId) return;
        
        const activeRide = appState.getActiveRide();
        const rideRequests = appState.getRideRequests();
        
        // Check if our request was removed (driver declined or accepted)
        const ourRequest = rideRequests.find(req => req.id === this.currentRequestId);
        
        if (!ourRequest) {
            // Our request was removed - check if it became an active ride
            const expectedRideId = 'RIDE-' + this.currentRequestId;
            
            if (activeRide && activeRide.id === expectedRideId) {
                // Driver accepted! Redirect to active ride page
            this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                
                // Show success message before redirect
                this.showNotification('Driver found! Redirecting to ride page...', 'success');
                
                // Small delay to show the notification
                setTimeout(() => {
                    window.location.href = `./active-ride.html?rideId=${activeRide.id}`;
                }, 1000);
                
                // Clear current request ID since we now have an active ride
                this.currentRequestId = null;
            } else {
                // Request was declined or removed
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                this.showNotification('No driver was available for your ride request.', 'warning');
                this.currentRequestId = null;
            }
        } else {
            // Request still exists, check if there's an active ride with our request ID
            const expectedRideId = 'RIDE-' + this.currentRequestId;
            if (activeRide && activeRide.id === expectedRideId) {
                // Driver accepted! Redirect to active ride page
                this.stopStatusPolling();
                this.hideFullScreenLoadingModal();
                
                // Show success message before redirect
                this.showNotification('Driver found! Redirecting to ride page...', 'success');
                
                // Small delay to show the notification
                setTimeout(() => {
                    window.location.href = `./active-ride.html?rideId=${activeRide.id}`;
                }, 1000);
            
            // Clear current request ID since we now have an active ride
            this.currentRequestId = null;
            }
        }
    }

    /**
     * Start polling for ride status updates
     */
    startStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
        }
        
        this.statusPollingInterval = setInterval(() => {
            this._checkRideStatus();
        }, 2000);
    }

    /**
     * Stop polling for ride status updates
     */
    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
    }

    /**
     * Show full-screen loading modal for ride request
     * @param {string} requestId - Ride request ID
     * @param {Object} rideRequest - Ride request object
     */
    showFullScreenLoadingModal(requestId, rideRequest) {
        // Create full-screen loading modal
        const loadingModalHtml = `
            <div class="modal fade" id="full-screen-loading-modal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content" style="background: linear-gradient(135deg, #9E1B32 0%, #C41E3A 50%, #FFFFFF 100%);">
                        <div class="modal-body d-flex flex-column justify-content-center align-items-center text-white">
                            <div class="text-center">
                                <!-- Logo/Icon -->
                                <div class="mb-4">
                                    <i class="bi bi-car-front-fill" style="font-size: 4rem; opacity: 0.8;"></i>
                                </div>
                                
                                <!-- Main Loading Animation -->
                                <div class="mb-4">
                                    <div class="spinner-border spinner-border-lg" role="status" style="width: 3rem; height: 3rem;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                                
                                <!-- Status Text -->
                                <h3 class="mb-3 fw-bold">Finding Your Driver</h3>
                                <p class="lead mb-4">We're searching for the best driver near you...</p>
                                
                                <!-- Ride Details Card -->
                                <div class="card" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
                                    <div class="card-body text-center">
                                        <h6 class="card-title mb-3">
                                            <i class="bi bi-map me-2"></i>Your Ride Details
                                        </h6>
                                        <div class="row text-start">
                                            <div class="col-6">
                                                <div class="mb-2">
                                                    <strong>From:</strong><br>
                                                    <small>${rideRequest.pickupLocation}</small>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Passengers:</strong><br>
                                                    <small>${rideRequest.passengerCount}</small>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="mb-2">
                                                    <strong>To:</strong><br>
                                                    <small>${rideRequest.dropoffLocation}</small>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Fare:</strong><br>
                                                    <small>$${rideRequest.estimatedFare.toFixed(2)}</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Progress Indicators -->
                                <div class="mt-4">
                                    <div class="row text-center">
                                        <div class="col-4">
                                            <div class="loading-step active" id="step-1">
                                                <i class="bi bi-search d-block mb-2"></i>
                                                <small>Searching</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="loading-step" id="step-2">
                                                <i class="bi bi-person-check d-block mb-2"></i>
                                                <small>Driver Found</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="loading-step" id="step-3">
                                                <i class="bi bi-car-front d-block mb-2"></i>
                                                <small>Ride Active</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Cancel Button -->
                                <div class="mt-4">
                                    <button class="btn btn-outline-light" onclick="riderInterface.cancelRideRequest('${requestId}')">
                                        <i class="bi bi-x-circle me-2"></i>Cancel Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', loadingModalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('full-screen-loading-modal'));
        modal.show();
        
        // Store current request for potential cancellation
        this.currentRequestId = requestId;
        
        // Set timeout for driver search (30 seconds)
        this.driverSearchTimeout = setTimeout(() => {
            if (this.currentRequestId === requestId) {
                this.showDriverSearchTimeout();
            }
        }, 30000);
        
        // Add CSS for loading steps
        const style = document.createElement('style');
        style.textContent = `
            .loading-step {
                opacity: 0.5;
                transition: opacity 0.3s ease;
            }
            .loading-step.active {
                opacity: 1;
                color: #fff;
            }
            .loading-step i {
                font-size: 1.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Hide full-screen loading modal
     */
    hideFullScreenLoadingModal() {
        // Clear timeout
        if (this.driverSearchTimeout) {
            clearTimeout(this.driverSearchTimeout);
            this.driverSearchTimeout = null;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('full-screen-loading-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Remove modal from DOM
        setTimeout(() => {
            const modalElement = document.getElementById('full-screen-loading-modal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
    }

    /**
     * Show driver search timeout message
     */
    showDriverSearchTimeout() {
        this.stopStatusPolling();
        this.hideFullScreenLoadingModal();
        
        // Show timeout message with options
        const timeoutModalHtml = `
            <div class="modal fade" id="driver-timeout-modal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-clock-history me-2"></i>Still Searching for Driver
                            </h5>
                        </div>
                        <div class="modal-body text-center">
                            <div class="mb-3">
                                <i class="bi bi-car-front text-warning" style="font-size: 3rem;"></i>
                    </div>
                            <h6>No driver has accepted your ride yet</h6>
                            <p class="text-muted">This could mean:</p>
                            <ul class="list-unstyled text-start">
                                <li><i class="bi bi-check-circle text-success me-2"></i>All drivers are currently busy</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Drivers may need to refresh their page</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Try requesting again in a few minutes</li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" onclick="riderInterface.cancelRideRequest('${this.currentRequestId}')">
                                <i class="bi bi-x-circle me-2"></i>Cancel Request
                            </button>
                            <button type="button" class="btn btn-primary" onclick="riderInterface.keepSearching()">
                                <i class="bi bi-search me-2"></i>Keep Searching
                            </button>
                        </div>
                    </div>
                </div>
                    </div>
                `;
        
        document.body.insertAdjacentHTML('beforeend', timeoutModalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('driver-timeout-modal'));
        modal.show();
    }

    /**
     * Keep searching for driver
     */
    keepSearching() {
        // Hide timeout modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('driver-timeout-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Remove modal from DOM
        setTimeout(() => {
            const modalElement = document.getElementById('driver-timeout-modal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
        
        // Show loading modal again
        if (this.currentRequestId) {
            // Get the original request data from AppState
            const requests = appState.getRideRequests();
            const request = requests.find(req => req.id === this.currentRequestId);
            if (request) {
                this.showFullScreenLoadingModal(this.currentRequestId, request);
                this.startStatusPolling();
            }
        }
    }

    /**
     * Cancel ride request
     * @param {string} requestId - Request ID to cancel
     */
    cancelRideRequest(requestId) {
        if (typeof appState !== 'undefined') {
            appState.removeRideRequest(requestId);
        }
        
        this.stopStatusPolling();
        this.hideFullScreenLoadingModal();
        this.currentRequestId = null;
        
        this.showNotification('Ride request cancelled', 'info');
    }


    /**
     * Show ride status card
     * @param {Object} ride - Ride object
     * @param {Object|null} driverDetails - Driver details object
     */
    showRideStatusCard(ride, driverDetails = null) {
        const statusCard = document.getElementById('ride-status-card');
        if (statusCard) {
            statusCard.style.display = 'block';
            this.updateRideStatusDisplay(ride, driverDetails);
        }
    }

    /**
     * Hide ride status card
     */
    hideRideStatusCard() {
        const statusCard = document.getElementById('ride-status-card');
        if (statusCard) {
            statusCard.style.display = 'none';
        }
    }

    /**
     * Show chat interface for active ride
     * @param {string} rideId - Active ride ID
     */
    showChatInterface(rideId) {
        // Create chat interface if it doesn't exist
        let chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = 'chat-container';
            chatContainer.className = 'chat-container mt-3';
            chatContainer.innerHTML = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="bi bi-chat-dots me-2"></i>Driver Communication</h6>
                        <button class="btn btn-sm btn-outline-secondary" onclick="riderInterface.hideChatInterface()">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div id="chat-messages" class="chat-messages p-3" style="height: 200px; overflow-y: auto;">
                            <!-- Messages will be loaded here -->
                        </div>
                        <div class="chat-input p-3 border-top">
                            <div class="input-group">
                                <input type="text" id="chat-input" class="form-control" placeholder="Type a message...">
                                <button class="btn btn-primary" id="send-message-btn">
                                    <i class="bi bi-send"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert after ride status card
            const statusCard = document.getElementById('ride-status-card');
            if (statusCard) {
                statusCard.parentNode.insertBefore(chatContainer, statusCard.nextSibling);
            }
            
            // Bind chat events
            this.bindChatEvents(rideId);
        }
        
        // Load existing messages
        this.loadChatMessages(rideId);
        
        // Start polling for new messages
        this.startChatPolling(rideId);
    }

    /**
     * Hide chat interface
     */
    hideChatInterface() {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.remove();
        }
        this.stopChatPolling();
    }

    /**
     * Bind chat events
     * @param {string} rideId - Active ride ID
     */
    bindChatEvents(rideId) {
        const sendBtn = document.getElementById('send-message-btn');
        const chatInput = document.getElementById('chat-input');
        
        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', () => this.sendMessage(rideId));
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(rideId);
                }
            });
        }
    }

    /**
     * Send a chat message
     * @param {string} rideId - Active ride ID
     */
    sendMessage(rideId) {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput || !chatInput.value.trim()) return;
        
        const message = {
            rideId: rideId,
            sender: 'rider',
            senderName: 'You',
            content: chatInput.value.trim()
        };
        
        appState.addChatMessage(message);
        chatInput.value = '';
        this.loadChatMessages(rideId);
    }

    /**
     * Load chat messages
     * @param {string} rideId - Active ride ID
     */
    loadChatMessages(rideId) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messages = appState.getChatMessages(rideId);
        messagesContainer.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender === 'rider' ? 'text-end' : 'text-start'} mb-2">
                <div class="d-inline-block p-2 rounded ${msg.sender === 'rider' ? 'bg-primary text-white' : 'bg-light'}">
                    <small class="d-block text-muted">${msg.senderName}</small>
                    ${msg.content}
                </div>
            </div>
        `).join('');
        
        // Check for ride completion message
        const completionMessage = messages.find(msg => 
            msg.sender === 'driver' && 
            msg.content.includes('Ride completed! Please confirm completion.')
        );
        
        if (completionMessage && !document.getElementById('ride-completion-modal')) {
            this.showRideCompletionModal(rideId);
        }
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Show ride completion confirmation modal
     * @param {string} rideId - Active ride ID
     */
    showRideCompletionModal(rideId) {
        const modalHtml = `
            <div class="modal fade" id="ride-completion-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-check-circle me-2"></i>Ride Completed!
                            </h5>
                        </div>
                        <div class="modal-body text-center">
                            <div class="mb-3">
                                <i class="bi bi-car-front-fill text-success" style="font-size: 3rem;"></i>
                            </div>
                            <h6>Your ride has been completed successfully!</h6>
                            <p class="text-muted">Please confirm the ride completion to finalize your trip.</p>
                            <div class="alert alert-info">
                                <strong>Thank you for using Tide Rides!</strong><br>
                                Your feedback helps us improve our service.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" onclick="riderInterface.confirmRideCompletion('${rideId}')">
                                <i class="bi bi-check me-2"></i>Confirm Completion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('ride-completion-modal'));
        modal.show();
    }

    /**
     * Confirm ride completion
     * @param {string} rideId - Active ride ID
     */
    confirmRideCompletion(rideId) {
        // Hide chat interface
        this.hideChatInterface();
        
        // Hide ride status card
        this.hideRideStatusCard();
        
        // Clear chat messages for this ride
        appState.clearChatMessages(rideId);
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ride-completion-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Remove modal from DOM
        setTimeout(() => {
            const modalElement = document.getElementById('ride-completion-modal');
            if (modalElement) {
                modalElement.remove();
            }
        }, 300);
        
        this.showNotification('Ride completed successfully! Thank you for using Tide Rides.', 'success');
    }

    /**
     * Start polling for chat messages
     * @param {string} rideId - Active ride ID
     */
    startChatPolling(rideId) {
        this.stopChatPolling();
        this.chatPollingInterval = setInterval(() => {
            this.loadChatMessages(rideId);
        }, 1000);
    }

    /**
     * Stop polling for chat messages
     */
    stopChatPolling() {
        if (this.chatPollingInterval) {
            clearInterval(this.chatPollingInterval);
            this.chatPollingInterval = null;
        }
    }

    /**
     * Update ride status display
     * @param {Object} ride - Ride object
     * @param {Object|null} driverDetails - Driver details object
     */
    updateRideStatusDisplay(ride, driverDetails = null) {
        const statusCard = document.getElementById('ride-status-card');
        const driverInfo = document.getElementById('driver-info');
        
        if (!statusCard) return;
        
        // Update status card title
        const statusTitle = statusCard.querySelector('.card-title');
        if (statusTitle) {
            statusTitle.textContent = 'Driver Assigned!';
        }
        
        // Update status text
        const statusText = statusCard.querySelector('.card-text');
        if (statusText) {
            statusText.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <span>Your driver is on the way!</span>
                </div>
                <div class="small text-muted">
                    <strong>From:</strong> ${ride.pickupLocation}<br>
                    <strong>To:</strong> ${ride.dropoffLocation}<br>
                    <strong>Passengers:</strong> ${ride.passengerCount}<br>
                    <strong>Estimated Fare:</strong> $${ride.estimatedFare.toFixed(2)}
                </div>
            `;
        }
        
        // Show driver info if available
        if (driverInfo && driverDetails) {
            driverInfo.style.display = 'block';
            
            // Update driver details
            const driverImg = driverInfo.querySelector('img');
            const driverName = driverInfo.querySelector('h6');
            const driverRating = driverInfo.querySelector('small');
            const vehicleInfo = driverInfo.querySelector('.small');

            if (driverImg) driverImg.src = `https://via.placeholder.com/40x40/4a7c59/ffffff?text=${driverDetails.name.charAt(0)}`;
            if (driverName) driverName.textContent = driverDetails.name;
            if (driverRating) driverRating.textContent = `Rating: ${driverDetails.rating} ⭐`;
            if (vehicleInfo) {
                vehicleInfo.innerHTML = `
                    <i class="bi bi-car-front me-1"></i>${driverDetails.vehicle}<br>
                    <i class="bi bi-clock me-1"></i>ETA: ${ride.distance || 5} minutes
                `;
            }
        } else if (driverInfo) {
            driverInfo.style.display = 'none';
        }
        
        // Set current ride for tracking
        this.currentRide = ride;
    }

    /**
     * Simulate ride progress
     * @param {Object} ride - Ride object
     */
    simulateRideProgress(ride) {
        const progressBar = document.getElementById('ride-progress');
        let progress = 25;

        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;

            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            // Update ride status
            if (progress >= 50 && ride.status === 'requested') {
                ride.status = 'driver_assigned';
                this.updateRideStatusDisplay(ride);
            }

            if (progress >= 75 && ride.status === 'driver_assigned') {
                ride.status = 'driver_arrived';
                this.showNotification('Your driver has arrived!', 'success');
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
                this.completeRide(ride);
            }
        }, 2000);
    }

    /**
     * Complete ride
     * @param {Object} ride - Ride object
     */
    completeRide(ride) {
        ride.status = 'completed';
        ride.completedAt = Date.now();

        // Add to ride history
        this.rideHistory.unshift(ride);
        this.saveRideHistory();

        // Update driver availability
        this.campusData.updateDriverAvailability(ride.driver.id, true, null);

        // Hide ride status card
        const statusCard = document.getElementById('ride-status-card');
        if (statusCard) {
            statusCard.style.display = 'none';
        }

        // Show completion notification
        this.showNotification('Ride completed successfully!', 'success');

        // Update ride statistics
        this.updateRideStatistics();

        // Clear current ride
        this.currentRide = null;
    }

    /**
     * Cancel ride
     */
    cancelRide() {
        // Check if we have an active ride request
        if (this.currentRequestId && typeof appState !== 'undefined') {
            if (confirm('Are you sure you want to cancel this ride request?')) {
                // Remove ride request from shared state
                appState.removeRideRequest(this.currentRequestId);

                // Hide ride status card
                const statusCard = document.getElementById('ride-status-card');
                if (statusCard) {
                    statusCard.style.display = 'none';
                }

                // Show cancellation notification
                this.showNotification('Ride request cancelled successfully', 'info');

                // Clear current request
                this.currentRequestId = null;
                
                // Stop polling
                this.stopStatusPolling();
            }
        } else if (this.currentRide) {
            // Legacy support for active rides
            if (confirm('Are you sure you want to cancel this ride?')) {
                // Update driver availability
                this.campusData.updateDriverAvailability(this.currentRide.driver.id, true, null);

                // Hide ride status card
                const statusCard = document.getElementById('ride-status-card');
                if (statusCard) {
                    statusCard.style.display = 'none';
                }

                // Show cancellation notification
                this.showNotification('Ride cancelled successfully', 'info');

                // Clear current ride
                this.currentRide = null;
            }
        }
    }

    /**
     * Track ride
     */
    trackRide() {
        if (!this.currentRide) return;

        this.showNotification('Opening ride tracking...', 'info');
        // Future implementation: Open detailed tracking view
    }

    /**
     * Update fare estimate
     */
    updateFareEstimate() {
        const pickup = document.getElementById('pickup-location').value.trim();
        const dropoff = document.getElementById('dropoff-location').value.trim();
        const passengerCount = this.getPassengerCount();
        
        if (pickup && dropoff && 
            this.locationServices.isValidLocation(pickup) && 
            this.locationServices.isValidLocation(dropoff)) {
            
            try {
                const fareCalculation = this.shortestPath.calculateFare(pickup, dropoff, passengerCount);
                // Could update a fare estimate display here
                console.log(`Estimated fare: $${fareCalculation.totalFare.toFixed(2)} for ${passengerCount} passengers ($5 per person)`);
            } catch (error) {
                console.warn('Could not calculate fare estimate:', error.message);
            }
        }
    }

    /**
     * Load user data from localStorage
     */
    loadUserData() {
        const userData = localStorage.getItem('solarChauffeur_user');
        if (userData) {
            const user = JSON.parse(userData);
            document.getElementById('rider-name').textContent = user.name || 'John Doe';
        }
    }

    /**
     * Update location display
     */
    async updateLocationDisplay() {
        try {
            const location = await this.locationServices.getCurrentLocationOrDefault();
            const nearestLocation = this.locationServices.findNearestCampusLocation(location.lat, location.lng);
            
            if (nearestLocation) {
                document.getElementById('current-location').textContent = nearestLocation.name;
            }
        } catch (error) {
            console.warn('Could not update location display:', error.message);
            document.getElementById('current-location').textContent = 'Ferguson Student Center';
        }
    }

    /**
     * Populate location suggestions
     */
    populateLocationSuggestions() {
        const locations = Object.keys(this.campusData.getLocations());
        // Could populate a dropdown or suggestions list here
    }

    /**
     * Update ride statistics display
     */
    updateRideStatistics() {
        const totalRides = this.rideHistory.length;
        
        // Update total rides
        const totalRidesElement = document.getElementById('total-rides');
        if (totalRidesElement) {
            totalRidesElement.textContent = totalRides;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('ride-progress-bar');
        if (progressBar) {
            const progress = Math.min((totalRides / 20) * 100, 100); // 20 rides = 100%
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Initialize the interactive map
     */
    initializeMap() {
        this.mapInitRetries = (this.mapInitRetries || 0) + 1;
        
        if (this.mapInitRetries > 10) {
            this.showMapError('Interactive map unavailable');
            return;
        }
        
        try {
            const deps = {
                leaflet: typeof L !== 'undefined',
                campusData: this.campusData && typeof this.campusData.getCampusCenter === 'function',
                locationServices: this.locationServices && typeof this.locationServices.findNearestCampusLocation === 'function'
            };
            
            if (Object.values(deps).every(Boolean)) {
                if (!this.mapIntegration) {
                    this.mapIntegration = new MapIntegration(this.campusData, this.locationServices);
                    window.mapIntegration = this.mapIntegration;
                }
            } else {
                setTimeout(() => this.initializeMap(), 500);
            }
        } catch (error) {
            setTimeout(() => this.initializeMap(), 1000);
        }
    }

    /**
     * Show map error message
     * @param {string} message - Error message
     */
    showMapError(message) {
        const mapContainer = document.getElementById('campus-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100 bg-light">
                    <div class="text-center">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 text-muted">Map Unavailable</h6>
                        <small class="text-muted">${message}</small>
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Use current GPS location
     */
    async useCurrentLocation() {
        try {
            const locationData = await this.locationServices.getCurrentLocationWithBuilding();
            
            // Set pickup location
            const pickupInput = document.getElementById('pickup-location');
            pickupInput.value = locationData.nearestBuilding;
            pickupInput.classList.add('is-valid');
            
            // Update current location display
            document.getElementById('current-location').textContent = locationData.nearestBuilding;
            
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
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, warning, danger, info)
     */
    showNotification(message, type) {
        const alert = document.getElementById('notification-alert');
        const messageSpan = document.getElementById('notification-message');
        
        if (alert && messageSpan) {
            messageSpan.textContent = message;
            alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Generate unique ride ID
     * @returns {string} Unique ride ID
     */
    generateRideId() {
        return 'Ride-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Load ride history from localStorage
     * @returns {Array} Ride history array
     */
    loadRideHistory() {
        const history = localStorage.getItem('solarChauffeur_rideHistory');
        return history ? JSON.parse(history) : [];
    }

    /**
     * Save ride history to localStorage
     */
    saveRideHistory() {
        localStorage.setItem('solarChauffeur_rideHistory', JSON.stringify(this.rideHistory));
    }
}

// Initialize the rider interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.riderInterface = new RiderInterface();
});
