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
                    name: 'Stacy Streets',
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
            activeRide: null,
            rideHistory: [
                {
                    id: 'RIDE-001',
                    riderName: 'James Wilson',
                    pickupLocation: 'Ferguson Center',
                    dropoffLocation: 'Presidential Village',
                    passengerCount: 1,
                    cartSize: 'Standard',
                    estimatedFare: 5.00,
                    driverId: 'SC-001',
                    driverName: 'Stacy Streets',
                    status: 'completed',
                    startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    distance: '8 min',
                    completedAt: new Date(Date.now() - 86400000 + 480000).toISOString() // Yesterday + 8 min
                },
                {
                    id: 'RIDE-002',
                    riderName: 'James Wilson',
                    pickupLocation: 'Hewson Hall',
                    dropoffLocation: 'Student Center',
                    passengerCount: 2,
                    cartSize: 'Standard',
                    estimatedFare: 10.00,
                    driverId: 'SC-002',
                    driverName: 'Sarah Smith',
                    status: 'completed',
                    startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    distance: '6 min',
                    completedAt: new Date(Date.now() - 172800000 + 360000).toISOString() // 2 days ago + 6 min
                },
                {
                    id: 'RIDE-003',
                    riderName: 'James Wilson',
                    pickupLocation: 'Library',
                    dropoffLocation: 'Dorm Complex',
                    passengerCount: 1,
                    cartSize: 'Standard',
                    estimatedFare: 5.00,
                    driverId: 'SC-001',
                    driverName: 'Stacy Streets',
                    status: 'completed',
                    startTime: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                    distance: '7 min',
                    completedAt: new Date(Date.now() - 259200000 + 420000).toISOString() // 3 days ago + 7 min
                }
                // Note: In a real app, you'd have 15 rides total, but for demo purposes, 
                // we'll start with 3 and let the system build up naturally
            ],
            chatMessages: []
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
        // Check if a similar request already exists (same rider, pickup, dropoff within last 30 seconds)
        const now = new Date();
        const thirtySecondsAgo = new Date(now.getTime() - 30000);
        
        const duplicateRequest = this.state.rideRequests.find(existingRequest => 
            existingRequest.riderName === request.riderName &&
            existingRequest.pickupLocation === request.pickupLocation &&
            existingRequest.dropoffLocation === request.dropoffLocation &&
            new Date(existingRequest.timestamp) > thirtySecondsAgo
        );
        
        if (duplicateRequest) {
            console.log('Duplicate request prevented for:', request.riderName);
            return duplicateRequest.id;
        }
        
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
     * Add a completed ride to history
     * @param {Object} rideData - Completed ride data object
     */
    addRideToHistory(rideData) {
        const rideWithTimestamp = {
            ...rideData,
            completedAt: new Date().toISOString()
        };
        this.state.rideHistory.push(rideWithTimestamp);
        this.saveState();
    }

    /**
     * Get ride history
     * @returns {Array} Array of completed ride objects
     */
    getRideHistory() {
        return this.state.rideHistory;
    }

    /**
     * Add a chat message
     * @param {Object} message - Chat message object with sender, content, timestamp
     */
    addChatMessage(message) {
        const messageWithId = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };
        this.state.chatMessages.push(messageWithId);
        this.saveState();
        return messageWithId.id;
    }

    /**
     * Get chat messages for a specific ride
     * @param {string} rideId - Ride ID to get messages for
     * @returns {Array} Array of chat messages
     */
    getChatMessages(rideId) {
        return this.state.chatMessages.filter(msg => msg.rideId === rideId);
    }

    /**
     * Clear chat messages for a specific ride
     * @param {string} rideId - Ride ID to clear messages for
     */
    clearChatMessages(rideId) {
        this.state.chatMessages = this.state.chatMessages.filter(msg => msg.rideId !== rideId);
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