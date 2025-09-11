/**
 * Rider Interface Module for Solar Chauffeur
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

            // Calculate fare
            const fareCalculation = this.shortestPath.calculateFare(pickup, dropoff, passengerCount);
            
            // Update modal with calculated data
            this.updateRideConfirmationModal(pickup, dropoff, passengerCount, fareCalculation);
            
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
     */
    updateRideConfirmationModal(pickup, dropoff, passengerCount, fareCalculation) {
        document.getElementById('modal-pickup').textContent = pickup;
        document.getElementById('modal-dropoff').textContent = dropoff;
        document.getElementById('modal-passenger-count').textContent = passengerCount;
        document.getElementById('modal-cart-size').textContent = fareCalculation.cartSize;
        document.getElementById('estimated-fare').textContent = `$${fareCalculation.totalFare}`;
    }

    /**
     * Confirm ride request
     */
    async confirmRide() {
        try {
            const pickup = document.getElementById('modal-pickup').textContent;
            const dropoff = document.getElementById('modal-dropoff').textContent;
            const passengerCount = parseInt(document.getElementById('modal-passenger-count').textContent);

            // Find closest driver
            const driver = this.shortestPath.findClosestDriver(pickup);
            
            if (!driver) {
                this.showNotification('No available drivers found. Please try again later.', 'warning');
                return;
            }

            // Create ride object
            const rideId = this.generateRideId();
            const ride = {
                id: rideId,
                pickup: pickup,
                dropoff: dropoff,
                passengerCount: passengerCount,
                cartSize: document.getElementById('modal-cart-size').textContent,
                driver: driver,
                status: 'requested',
                timestamp: Date.now(),
                estimatedFare: this.shortestPath.calculateFare(pickup, dropoff, passengerCount).totalFare,
                estimatedTime: driver.estimatedArrival + this.shortestPath.findShortestPath(pickup, dropoff).time
            };

            this.currentRide = ride;
            
            // Update driver availability
            this.campusData.updateDriverAvailability(driver.id, false, rideId);

            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('rideConfirmationModal'));
            modal.hide();

            // Show success notification
            this.showNotification('Ride request submitted successfully!', 'success');

            // Show ride status card
            this.showRideStatusCard(ride);

            // Start ride simulation
            this.simulateRideProgress(ride);

        } catch (error) {
            console.error('Ride confirmation error:', error);
            this.showNotification('Error confirming ride. Please try again.', 'danger');
        }
    }

    /**
     * Show ride status card
     * @param {Object} ride - Ride object
     */
    showRideStatusCard(ride) {
        const statusCard = document.getElementById('ride-status-card');
        if (statusCard) {
            statusCard.style.display = 'block';
            this.updateRideStatusDisplay(ride);
        }
    }

    /**
     * Update ride status display
     * @param {Object} ride - Ride object
     */
    updateRideStatusDisplay(ride) {
        const driverInfo = document.getElementById('driver-info');
        if (driverInfo && ride.driver) {
            driverInfo.style.display = 'block';
            
            // Update driver details
            const driverImg = driverInfo.querySelector('img');
            const driverName = driverInfo.querySelector('h6');
            const driverRating = driverInfo.querySelector('small');
            const vehicleInfo = driverInfo.querySelector('.small');

            if (driverImg) driverImg.src = `https://via.placeholder.com/40x40/4a7c59/ffffff?text=${ride.driver.name.charAt(0)}`;
            if (driverName) driverName.textContent = ride.driver.name;
            if (driverRating) driverRating.textContent = `Rating: ${ride.driver.rating} ⭐`;
            if (vehicleInfo) {
                vehicleInfo.innerHTML = `
                    <i class="bi bi-car-front me-1"></i>${ride.driver.vehicle}<br>
                    <i class="bi bi-clock me-1"></i>ETA: ${ride.driver.estimatedArrival} minutes
                `;
            }
        }
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
        if (!this.currentRide) return;

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
                console.log(`Estimated fare: $${fareCalculation.totalFare} for ${passengerCount} passengers`);
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
