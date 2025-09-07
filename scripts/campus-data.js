/**
 * Campus Data Module for Solar Chauffeur
 */

class CampusData {
    constructor() {
        this.campusCenter = {
            lat: 33.209717,
            lng: -87.546836
        };
        this.locations = {
            'Gorgas Library': { lat: 33.212118, lng: -87.546128, type: 'academic' },
            'Denny Chimes': { lat: 33.209717, lng: -87.546836, type: 'landmark' },
            'Bryant-Denny Stadium': { lat:33.207301, lng: -87.549064, type: 'recreation' },
            'Ferguson Student Center': { lat: 33.214950, lng: -87.546286, type: 'hub' },
            'Coleman Coliseum': { lat: 33.203810, lng: -87.539703, type: 'recreation' },
            'Reese Phifer Hall': { lat: 33.209827, lng: -87.548377, type: 'academic' },
            'Ten Hoor Hall': { lat: 33.212642, lng: -87.549700, type: 'academic' },
            'Lloyd Hall': { lat: 33.211083, lng: -87.544275, type: 'academic' },
            'Smith Hall': { lat: 33.211929, lng: -87.544213, type: 'academic' },
            'Bidgood Hall': { lat: 33.211645, lng: -87.547811, type: 'academic' },
            'Russell Hall': { lat: 33.209751, lng: -87.542963, type: 'academic' },
            'Tutwiler Hall': { lat: 33.205335, lng: -87.549398, type: 'residential' },
            'Paty Hall': { lat: 33.216746, lng: -87.546687, type: 'residential' },
            'Ridgecrest South': { lat: 33.217327, lng: -87.549387, type: 'residential' },
            'Ridgecrest East': { lat: 33.217187, lng: -87.548609, type: 'residential' },
            'Blount Hall': { lat: 33.217078, lng: -87.548089, type: 'residential' },
            'Presidential Village': { lat: 33.219702, lng: -87.544141, type: 'residential' },
            'Riverside': { lat: 33.219702, lng: -87.544141, type: 'residential' },
            'Lakeside Dining': { lat: 33.217410, lng: -87.545917, type: 'dining' },
            'Fresh Foods Company': { lat: 33.212577, lng: -87.542908, type: 'dining' },
            'Student Recreation Center': { lat: 33.211597, lng: -87.531760, type: 'recreation' },
            'Aquatic Center': { lat: 33.205571, lng: -87.541472, type: 'recreation' },
            'Hewson Hall': { lat: 33.212038, lng: -87.551336, type: 'academic' },
            'Bryant Hall': { lat: 33.211212, lng: -87.541341, type: 'residential' },
            'Little Hall': { lat: 33.208714, lng: -87.545829, type: 'academic' },
            'Farrah Hall': { lat: 33.209130, lng: -87.544390, type: 'academic' },
            'Clark Hall': { lat: 33.212276, lng: -87.546541, type: 'academic' },
            'Gallalee Hall': { lat: 33.209542, lng: -87.544388, type: 'academic' },
            'Burke Dining Hall': { lat: 33.205335, lng: -87.549398, type: 'dining' }
        };

        // Weighted edges representing paths between locations
        // Weight represents travel time in minutes for golf cart
        this.paths = {
            'Gorgas Library': {
                'Ferguson Student Center': 2,
                'Reese Phifer Hall': 1,
                'Ten Hoor Hall': 2,
                'Lloyd Hall': 3,
                'Smith Hall': 4
            },
            'Denny Chimes': {
                'Bryant-Denny Stadium': 1,
                'Ferguson Student Center': 3,
                'Ten Hoor Hall': 2,
                'Lloyd Hall': 3,
                'Hewson Hall': 1
            },
            'Bryant-Denny Stadium': {
                'Denny Chimes': 1,
                'Coleman Coliseum': 4,
                'Student Recreation Center': 3,
                'Hewson Hall': 2
            },
            'Ferguson Student Center': {
                'Gorgas Library': 2,
                'Denny Chimes': 3,
                'Reese Phifer Hall': 1,
                'Ten Hoor Hall': 1,
                'Lloyd Hall': 2,
                'Tutwiler Hall': 2,
                'Paty Hall': 2,
                'Burke Dining Hall': 3,
                'Mary Harmon Bryant Hall': 1,
                'Little Hall': 1,
                'Farrah Hall': 2
            },
            'Coleman Coliseum': {
                'Bryant-Denny Stadium': 4,
                'Student Recreation Center': 2,
                'Aquatic Center': 1
            },
            'Reese Phifer Hall': {
                'Gorgas Library': 1,
                'Ferguson Student Center': 1,
                'Ten Hoor Hall': 1,
                'Lloyd Hall': 2
            },
            'Ten Hoor Hall': {
                'Gorgas Library': 2,
                'Ferguson Student Center': 1,
                'Reese Phifer Hall': 1,
                'Lloyd Hall': 1,
                'Smith Hall': 2,
                'Ten Hoor Parking': 1,
                'Osband Hall': 1,
                'Barnwell Hall': 2,
                'Houser Hall': 3
            },
            'Lloyd Hall': {
                'Gorgas Library': 3,
                'Ferguson Student Center': 2,
                'Reese Phifer Hall': 2,
                'Ten Hoor Hall': 1,
                'Smith Hall': 1,
                'Bidgood Hall': 2,
                'Houser Hall': 2
            },
            'Smith Hall': {
                'Gorgas Library': 4,
                'Ten Hoor Hall': 2,
                'Lloyd Hall': 1,
                'Bidgood Hall': 1,
                'Manly Hall': 2
            },
            'Bidgood Hall': {
                'Lloyd Hall': 2,
                'Smith Hall': 1,
                'Manly Hall': 1,
                'Russell Hall': 2
            },
            'Manly Hall': {
                'Smith Hall': 2,
                'Bidgood Hall': 1,
                'Russell Hall': 1
            },
            'Russell Hall': {
                'Bidgood Hall': 2,
                'Manly Hall': 1
            },
            'Tutwiler Hall': {
                'Ferguson Student Center': 2,
                'Paty Hall': 1,
                'Ridgecrest South': 2,
                'Burke Dining Hall': 1
            },
            'Paty Hall': {
                'Ferguson Student Center': 2,
                'Tutwiler Hall': 1,
                'Ridgecrest South': 1,
                'Ridgecrest North': 2
            },
            'Ridgecrest South': {
                'Tutwiler Hall': 2,
                'Paty Hall': 1,
                'Ridgecrest North': 1,
                'Blount Hall': 2
            },
            'Ridgecrest North': {
                'Paty Hall': 2,
                'Ridgecrest South': 1,
                'Blount Hall': 1,
                'Presidential Village': 2
            },
            'Blount Hall': {
                'Ridgecrest South': 2,
                'Ridgecrest North': 1,
                'Presidential Village': 1
            },
            'Presidential Village': {
                'Ridgecrest North': 2,
                'Blount Hall': 1
            },
            'Burke Dining Hall': {
                'Ferguson Student Center': 3,
                'Tutwiler Hall': 1,
                'Lakeside Dining': 1,
                'Campus Drive Parking': 2
            },
            'Lakeside Dining': {
                'Burke Dining Hall': 1,
                'Fresh Foods Company': 1,
                'Campus Drive Parking': 1
            },
            'Fresh Foods Company': {
                'Lakeside Dining': 1,
                'Capstone Parking Deck': 1
            },
            'Student Recreation Center': {
                'Bryant-Denny Stadium': 3,
                'Coleman Coliseum': 2,
                'Aquatic Center': 1
            },
            'Aquatic Center': {
                'Coleman Coliseum': 1,
                'Student Recreation Center': 1
            },
            'Campus Drive Parking': {
                'Burke Dining Hall': 2,
                'Lakeside Dining': 1,
                'Capstone Parking Deck': 1
            },
            'Capstone Parking Deck': {
                'Campus Drive Parking': 1,
                'Fresh Foods Company': 1,
                'Ferguson Parking': 2,
                'Clark Hall': 1
            },
            'Ten Hoor Parking': {
                'Ten Hoor Hall': 1,
                'Ferguson Parking': 1
            },
            'Ferguson Parking': {
                'Capstone Parking Deck': 2,
                'Ten Hoor Parking': 1,
                'Ferguson Student Center': 1
            },
            'Hewson Hall': {
                'Denny Chimes': 1,
                'Bryant-Denny Stadium': 2,
                'Mary Harmon Bryant Hall': 2
            },
            'Mary Harmon Bryant Hall': {
                'Hewson Hall': 2,
                'Ferguson Student Center': 1,
                'Little Hall': 1
            },
            'Little Hall': {
                'Mary Harmon Bryant Hall': 1,
                'Ferguson Student Center': 1,
                'Farrah Hall': 2
            },
            'Farrah Hall': {
                'Little Hall': 2,
                'Ferguson Student Center': 2,
                'Clark Hall': 1
            },
            'Clark Hall': {
                'Farrah Hall': 1,
                'Capstone Parking Deck': 1,
                'Osband Hall': 2
            },
            'Osband Hall': {
                'Clark Hall': 2,
                'Ten Hoor Hall': 1,
                'Barnwell Hall': 1
            },
            'Barnwell Hall': {
                'Osband Hall': 1,
                'Ten Hoor Hall': 2,
                'Houser Hall': 1
            },
            'Houser Hall': {
                'Barnwell Hall': 1,
                'Ten Hoor Hall': 3,
                'Lloyd Hall': 2
            }
        };

        // Sample driver locations and availability
        this.drivers = [
            {
                id: 'SC-001',
                name: 'John Driver',
                rating: 4.9,
                vehicle: 'Solar Golf Cart Alpha',
                location: 'Ferguson Student Center',
                available: true,
                batteryLevel: 85,
                currentRide: null
            },
            {
                id: 'SC-002',
                name: 'Sarah Smith',
                rating: 4.8,
                vehicle: 'Solar Golf Cart Beta',
                location: 'Gorgas Library',
                available: true,
                batteryLevel: 92,
                currentRide: null
            },
            {
                id: 'SC-003',
                name: 'Mike Johnson',
                rating: 4.7,
                vehicle: 'Solar Golf Cart Gamma',
                location: 'Tutwiler Hall',
                available: false,
                batteryLevel: 45,
                currentRide: 'Ride-12345'
            },
            {
                id: 'SC-004',
                name: 'Emily Davis',
                rating: 4.9,
                vehicle: 'Solar Golf Cart Delta',
                location: 'Student Recreation Center',
                available: true,
                batteryLevel: 78,
                currentRide: null
            },
            {
                id: 'SC-005',
                name: 'David Wilson',
                rating: 4.6,
                vehicle: 'Solar Golf Cart Epsilon',
                location: 'Burke Dining Hall',
                available: true,
                batteryLevel: 88,
                currentRide: null
            }
        ];

        // Popular pickup/dropoff combinations (Real UA routes)
        this.popularRoutes = [
            { from: 'Ferguson Student Center', to: 'Gorgas Library', frequency: 0.8 },
            { from: 'Gorgas Library', to: 'Ferguson Student Center', frequency: 0.7 },
            { from: 'Tutwiler Hall', to: 'Burke Dining Hall', frequency: 0.6 },
            { from: 'Burke Dining Hall', to: 'Tutwiler Hall', frequency: 0.5 },
            { from: 'Ferguson Student Center', to: 'Student Recreation Center', frequency: 0.4 },
            { from: 'Ten Hoor Hall', to: 'Gorgas Library', frequency: 0.3 },
            { from: 'Ridgecrest South', to: 'Ferguson Student Center', frequency: 0.3 },
            { from: 'Ferguson Student Center', to: 'Bryant-Denny Stadium', frequency: 0.2 }
        ];

        // Campus boundaries for validation (University of Alabama campus)
        this.campusBounds = {
            north: 33.2140,
            south: 33.2040,
            east: -87.5360,
            west: -87.5520
        };
    }

    /**
     * Get campus center coordinates
     * @returns {Object} Campus center coordinates with lat/lng
     */
    getCampusCenter() {
        return this.campusCenter;
    }

    /**
     * Get all available locations
     * @returns {Object} All campus locations
     */
    getLocations() {
        return this.locations;
    }

    /**
     * Get all paths between locations
     * @returns {Object} Path weights between locations
     */
    getPaths() {
        return this.paths;
    }

    /**
     * Get available drivers
     * @returns {Array} Available drivers
     */
    getAvailableDrivers() {
        return this.drivers.filter(driver => driver.available);
    }

    /**
     * Get driver by ID
     * @param {string} driverId - Driver ID
     * @returns {Object|null} Driver object or null
     */
    getDriverById(driverId) {
        return this.drivers.find(driver => driver.id === driverId) || null;
    }

    /**
     * Update driver availability
     * @param {string} driverId - Driver ID
     * @param {boolean} available - Availability status
     * @param {string|null} rideId - Current ride ID
     */
    updateDriverAvailability(driverId, available, rideId = null) {
        const driver = this.getDriverById(driverId);
        if (driver) {
            driver.available = available;
            driver.currentRide = rideId;
        }
    }

    /**
     * Get location coordinates
     * @param {string} locationName - Location name
     * @returns {Object|null} Coordinates or null
     */
    getLocationCoordinates(locationName) {
        return this.locations[locationName] || null;
    }

    /**
     * Check if location exists
     * @param {string} locationName - Location name
     * @returns {boolean} True if location exists
     */
    locationExists(locationName) {
        return locationName in this.locations;
    }

    /**
     * Get popular routes
     * @returns {Array} Popular route combinations
     */
    getPopularRoutes() {
        return this.popularRoutes;
    }

    /**
     * Check if coordinates are within campus bounds
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if within campus
     */
    isWithinCampus(lat, lng) {
        return lat >= this.campusBounds.south && 
               lat <= this.campusBounds.north && 
               lng >= this.campusBounds.west && 
               lng <= this.campusBounds.east;
    }

    /**
     * Get location suggestions based on partial input
     * @param {string} partial - Partial location name
     * @returns {Array} Matching location names
     */
    getLocationSuggestions(partial) {
        const query = partial.toLowerCase();
        return Object.keys(this.locations).filter(location => 
            location.toLowerCase().includes(query)
        );
    }

    /**
     * Calculate base fare for route
     * @param {string} from - Starting location
     * @param {string} to - Destination location
     * @param {string} rideType - Type of ride (standard, premium, group)
     * @returns {number} Base fare in dollars
     */
    calculateBaseFare(from, to, rideType = 'standard') {
        const pathWeight = this.paths[from] && this.paths[from][to] ? this.paths[from][to] : 5;
        
        const baseRates = {
            'standard': 2.50,
            'premium': 3.50,
            'group': 4.50
        };

        const timeRate = 0.75; // $0.75 per minute
        const baseRate = baseRates[rideType] || baseRates.standard;
        
        return baseRate + (pathWeight * timeRate);
    }

    /**
     * Validate popular routes data integrity
     * @returns {boolean} True if all routes are valid
     */
    validatePopularRoutes() {
        const invalidRoutes = [];
        
        this.popularRoutes.forEach(route => {
            if (!this.locations[route.from]) {
                invalidRoutes.push(`Missing location: ${route.from}`);
            }
            if (!this.locations[route.to]) {
                invalidRoutes.push(`Missing location: ${route.to}`);
            }
        });
        
        if (invalidRoutes.length > 0) {
            console.error('Invalid popular routes found:', invalidRoutes);
        }
        
        return invalidRoutes.length === 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampusData;
}

