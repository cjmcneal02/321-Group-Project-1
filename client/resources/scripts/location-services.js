/**
 * Location Services Module for Solar Chauffeur
 * Handles geolocation, campus validation, and location utilities
 */

class LocationServices {
    constructor(campusData) {
        this.campusData = campusData;
        this.currentLocation = null;
        this.locationPermission = null;
    }

    /**
     * Get user's current location using navigator.geolocation
     * @returns {Promise<Object>} Promise resolving to location object
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000 // 1 minute
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        isRealGPS: true
                    };

                    this.currentLocation = location;
                    this.locationPermission = 'granted';
                    resolve(location);
                },
                (error) => {
                    this.locationPermission = 'denied';
                    let errorMessage = 'Unable to get location';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }

    /**
     * Watch user's location for changes
     * @param {Function} callback - Callback function for location updates
     * @returns {number} Watch ID for clearing the watch
     */
    watchLocation(callback) {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // 1 minute
        };

        return navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                this.currentLocation = location;
                callback(location);
            },
            (error) => {
                console.error('Location watch error:', error);
            },
            options
        );
    }

    /**
     * Clear location watch
     * @param {number} watchId - Watch ID returned by watchLocation
     */
    clearLocationWatch(watchId) {
        if (navigator.geolocation && watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    }

    /**
     * Geocoding simulation for campus locations
     * @param {string} locationName - Name of the location
     * @returns {Promise<Object>} Promise resolving to coordinates
     */
    async geocodeLocation(locationName) {
        return new Promise((resolve, reject) => {
            // Simulate API delay
            setTimeout(() => {
                const coordinates = this.campusData.getLocationCoordinates(locationName);
                
                if (coordinates) {
                    resolve({
                        lat: coordinates.lat,
                        lng: coordinates.lng,
                        formatted_address: locationName,
                        place_id: `campus_${locationName.toLowerCase().replace(/\s+/g, '_')}`
                    });
                } else {
                    reject(new Error(`Location "${locationName}" not found`));
                }
            }, 100);
        });
    }

    /**
     * Reverse geocoding simulation
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<Object>} Promise resolving to location name
     */
    async reverseGeocode(lat, lng) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const locations = this.campusData.getLocations();
                let closestLocation = null;
                let minDistance = Infinity;

                // Find closest campus location
                for (const [name, coords] of Object.entries(locations)) {
                    const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestLocation = name;
                    }
                }

                if (closestLocation && minDistance < 0.1) { // Within 100m
                    resolve({
                        location_name: closestLocation,
                        distance: minDistance,
                        coordinates: { lat, lng }
                    });
                } else {
                    reject(new Error('Location not within campus boundaries'));
                }
            }, 150);
        });
    }

    /**
     * Validate location is within campus boundaries
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if within campus
     */
    validateCampusLocation(lat, lng) {
        return this.campusData.isWithinCampus(lat, lng);
    }

    /**
     * Find nearest campus location to given coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Object|null} Nearest location or null
     */
    findNearestCampusLocation(lat, lng) {
        const locations = this.campusData.getLocations();
        let nearestLocation = null;
        let minDistance = Infinity;

        for (const [name, coords] of Object.entries(locations)) {
            const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestLocation = {
                    name: name,
                    coordinates: coords,
                    distance: distance
                };
            }
        }

        return nearestLocation;
    }

    /**
     * Calculate distance between two coordinates
     * @param {number} lat1 - First latitude
     * @param {number} lng1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lng2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get location suggestions based on partial input
     * @param {string} partial - Partial location name
     * @returns {Array} Matching location names
     */
    getLocationSuggestions(partial) {
        return this.campusData.getLocationSuggestions(partial);
    }

    /**
     * Check if location name is valid
     * @param {string} locationName - Location name to validate
     * @returns {boolean} True if valid
     */
    isValidLocation(locationName) {
        return this.campusData.locationExists(locationName);
    }

    /**
     * Get campus center coordinates
     * @returns {Object} Campus center coordinates
     */
    getCampusCenter() {
        return this.campusData.campusCenter;
    }

    /**
     * Request location permission from user
     * @returns {Promise<boolean>} Promise resolving to permission status
     */
    async requestLocationPermission() {
        try {
            await this.getCurrentLocation();
            return true;
        } catch (error) {
            console.warn('Location permission denied:', error.message);
            return false;
        }
    }

    /**
     * Get location permission status
     * @returns {string|null} Permission status
     */
    getLocationPermissionStatus() {
        return this.locationPermission;
    }

    /**
     * Set default location (fallback when GPS unavailable)
     * @param {string} locationName - Default location name
     */
    setDefaultLocation(locationName) {
        const coordinates = this.campusData.getLocationCoordinates(locationName);
        
        if (coordinates) {
            this.currentLocation = {
                lat: coordinates.lat,
                lng: coordinates.lng,
                accuracy: 0,
                timestamp: Date.now(),
                isDefault: true
            };
        }
    }

    /**
     * Get current location or default
     * @returns {Object|null} Current location object
     */
    getCurrentLocationOrDefault() {
        if (this.currentLocation) {
            return this.currentLocation;
        }

        // Return campus center as default
        const campusCenter = this.getCampusCenter();
        return {
            lat: campusCenter.lat,
            lng: campusCenter.lng,
            accuracy: 0,
            timestamp: Date.now(),
            isDefault: true
        };
    }

    /**
     * Format location for display
     * @param {Object} location - Location object
     * @returns {string} Formatted location string
     */
    formatLocation(location) {
        if (!location) return 'Unknown Location';
        
        if (location.isDefault) {
            return 'Campus Center (Default)';
        }
        
        return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }

    /**
     * Get location accuracy description
     * @param {number} accuracy - Accuracy in meters
     * @returns {string} Accuracy description
     */
    getAccuracyDescription(accuracy) {
        if (accuracy < 10) return 'Very High';
        if (accuracy < 50) return 'High';
        if (accuracy < 100) return 'Medium';
        if (accuracy < 500) return 'Low';
        return 'Very Low';
    }

    /**
     * Get nearest campus building name from GPS coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {string} Nearest campus building name
     */
    getNearestCampusBuildingName(lat, lng) {
        const nearestLocation = this.findNearestCampusLocation(lat, lng);
        return nearestLocation ? nearestLocation.name : 'Unknown Location';
    }

    /**
     * Get current location with nearest campus building
     * @returns {Promise<Object>} Promise resolving to location with building name
     */
    async getCurrentLocationWithBuilding() {
        try {
            const location = await this.getCurrentLocation();
            const nearestLocation = this.findNearestCampusLocation(location.lat, location.lng);
            const isOnCampus = this.validateCampusLocation(location.lat, location.lng);
            
            if (!isOnCampus) {
                // If user is far from campus, provide campus center as fallback
                const campusCenter = this.campusData.getCampusCenter();
                const distanceToCampus = this.calculateDistance(location.lat, location.lng, campusCenter.lat, campusCenter.lng);
                
                if (distanceToCampus > 5) { // More than 5km from campus
                    return {
                        ...location,
                        nearestBuilding: 'Ferguson Student Center', // Default campus center
                        nearestDistance: 0,
                        isOnCampus: false,
                        isFarFromCampus: true,
                        distanceToCampus: distanceToCampus
                    };
                }
            }
            
            return {
                ...location,
                nearestBuilding: nearestLocation.name,
                nearestDistance: nearestLocation.distance,
                isOnCampus: isOnCampus
            };
        } catch (error) {
            throw error;
        }
    }
}

// Export for use in other modules
// Export for browser environment
if (typeof window !== 'undefined') {
    window.LocationServices = LocationServices;
}
