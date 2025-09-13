/**
 * Centralized State Management for Tide Rides Application
 * Manages shared state for drivers, ride requests, and active rides using localStorage
 */

class AppState {
    constructor() {
        this.state = this._loadState();
    }

    /**
     * Load state from localStorage or initialize default state
     * @private
     */
    _loadState() {
        const savedState = localStorage.getItem('tideRidesState');
        if (savedState) {
            try {
                return JSON.parse(savedState);
            } catch (error) {
                console.error('Error parsing saved state:', error);
                return this._initializeState();
            }
        }
        return this._initializeState();
    }

    /**
     * Initialize default state with two active drivers
     * @private
     */
    _initializeState() {
        return {
            drivers: [
                {
                    id: 'SC-001',
                    name: 'John Driver',
                    rating: 4.9,
                    vehicle: 'Solar Golf Cart Alpha',
                    location: 'Hewson Hall',
                    available: true,
                    batteryLevel: 85,
                    currentRide: null,
                    totalRides: 23,
                    avgTip: 45.20,
                    status: 'Active'
                },
                {
                    id: 'SC-002',
                    name: 'Sarah Smith',
                    rating: 4.8,
                    vehicle: 'Solar Golf Cart Beta',
                    location: 'Presidential Village',
                    available: true,
                    batteryLevel: 92,
                    currentRide: null,
                    totalRides: 18,
                    avgTip: 42.15,
                    status: 'Active'
                }
            ],
            rideRequests: [],
            activeRide: null
        };
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('tideRidesState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    /**
     * Get the full state object
     * @returns {Object} Complete state object
     */
    getState() {
        return this.state;
    }

    /**
     * Get all drivers
     * @returns {Array} Array of driver objects
     */
    getDrivers() {
        return this.state.drivers;
    }

    /**
     * Update a specific driver
     * @param {string} driverId - ID of the driver to update
     * @param {Object} updates - Object containing fields to update
     */
    updateDriver(driverId, updates) {
        const driverIndex = this.state.drivers.findIndex(driver => driver.id === driverId);
        if (driverIndex !== -1) {
            this.state.drivers[driverIndex] = { ...this.state.drivers[driverIndex], ...updates };
            this.saveState();
        } else {
            console.warn(`Driver with ID ${driverId} not found`);
        }
    }

    /**
     * Add a new ride request
     * @param {Object} request - Ride request object
     */
    addRideRequest(request) {
        const requestWithId = {
            ...request,
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
        this.state.rideRequests.push(requestWithId);
        this.saveState();
        return requestWithId.id;
    }

    /**
     * Get all ride requests
     * @returns {Array} Array of ride request objects
     */
    getRideRequests() {
        return this.state.rideRequests;
    }

    /**
     * Clear all ride requests
     */
    clearRideRequests() {
        this.state.rideRequests = [];
        this.saveState();
    }

    /**
     * Set the active ride
     * @param {Object|null} ride - Active ride object or null
     */
    setActiveRide(ride) {
        this.state.activeRide = ride;
        this.saveState();
    }

    /**
     * Get the active ride
     * @returns {Object|null} Active ride object or null
     */
    getActiveRide() {
        return this.state.activeRide;
    }

    /**
     * Remove a ride request by ID
     * @param {string} requestId - ID of the request to remove
     */
    removeRideRequest(requestId) {
        this.state.rideRequests = this.state.rideRequests.filter(req => req.id !== requestId);
        this.saveState();
    }

    /**
     * Reset state to initial values
     */
    resetState() {
        this.state = this._initializeState();
        this.saveState();
    }
}

// Create and export a shared instance
const appState = new AppState();
