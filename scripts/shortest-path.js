/**
 * Shortest Path Algorithm Module for Solar Chauffeur
 * Implements Dijkstra's algorithm for finding optimal routes
 */

class ShortestPathAlgorithm {
    constructor(campusData) {
        this.campusData = campusData;
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
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
     * Find shortest path using Dijkstra's algorithm
     * @param {string} start - Starting location
     * @param {string} end - Destination location
     * @returns {Object} Path result with route, distance, and time
     */
    findShortestPath(start, end) {
        if (!this.campusData.locationExists(start) || !this.campusData.locationExists(end)) {
            throw new Error('Invalid start or end location');
        }

        if (start === end) {
            return {
                route: [start],
                distance: 0,
                time: 0,
                cost: 0
            };
        }

        const locations = this.campusData.getLocations();
        const paths = this.campusData.getPaths();
        
        // Initialize distances and previous nodes
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        
        // Initialize all locations
        Object.keys(locations).forEach(location => {
            distances[location] = Infinity;
            previous[location] = null;
            unvisited.add(location);
        });
        
        distances[start] = 0;
        
        // Dijkstra's algorithm
        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
            let current = null;
            let minDistance = Infinity;
            
            for (const node of unvisited) {
                if (distances[node] < minDistance) {
                    minDistance = distances[node];
                    current = node;
                }
            }
            
            if (current === null || current === end) {
                break;
            }
            
            unvisited.delete(current);
            
            // Check neighbors
            const neighbors = paths[current] || {};
            for (const neighbor in neighbors) {
                if (unvisited.has(neighbor)) {
                    const weight = neighbors[neighbor];
                    const newDistance = distances[current] + weight;
                    
                    if (newDistance < distances[neighbor]) {
                        distances[neighbor] = newDistance;
                        previous[neighbor] = current;
                    }
                }
            }
        }
        
        // Reconstruct path
        const route = [];
        let current = end;
        
        while (current !== null) {
            route.unshift(current);
            current = previous[current];
        }
        
        // Calculate total distance and time
        const totalTime = distances[end];
        const totalDistance = this.calculateRouteDistance(route);
        const cost = this.calculateRouteCost(route);
        
        return {
            route: route,
            distance: totalDistance,
            time: totalTime,
            cost: cost,
            valid: distances[end] !== Infinity
        };
    }

    /**
     * Calculate total distance for a route
     * @param {Array} route - Array of location names
     * @returns {number} Total distance in kilometers
     */
    calculateRouteDistance(route) {
        let totalDistance = 0;
        const locations = this.campusData.getLocations();
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = locations[route[i]];
            const to = locations[route[i + 1]];
            
            if (from && to) {
                totalDistance += this.calculateDistance(
                    from.lat, from.lng,
                    to.lat, to.lng
                );
            }
        }
        
        return totalDistance;
    }

    /**
     * Calculate cost for a route
     * @param {Array} route - Array of location names
     * @returns {number} Total cost in dollars
     */
    calculateRouteCost(route) {
        if (route.length < 2) return 0;
        
        const paths = this.campusData.getPaths();
        let totalTime = 0;
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            
            if (paths[from] && paths[from][to]) {
                totalTime += paths[from][to];
            }
        }
        
        // Base cost calculation
        const baseCost = 2.50;
        const timeRate = 0.75;
        
        return baseCost + (totalTime * timeRate);
    }

    /**
     * Find closest available driver to a location
     * @param {string} riderLocation - Rider's location
     * @returns {Object|null} Closest driver or null
     */
    findClosestDriver(riderLocation) {
        const availableDrivers = this.campusData.getAvailableDrivers();
        
        if (availableDrivers.length === 0) {
            return null;
        }
        
        let closestDriver = null;
        let shortestTime = Infinity;
        
        for (const driver of availableDrivers) {
            try {
                const pathResult = this.findShortestPath(driver.location, riderLocation);
                
                if (pathResult.valid && pathResult.time < shortestTime) {
                    shortestTime = pathResult.time;
                    closestDriver = {
                        ...driver,
                        estimatedArrival: pathResult.time,
                        distance: pathResult.distance,
                        route: pathResult.route
                    };
                }
            } catch (error) {
                console.warn(`Could not find path to driver ${driver.id}:`, error.message);
            }
        }
        
        return closestDriver;
    }

    /**
     * Calculate fare for a ride
     * @param {string} from - Starting location
     * @param {string} to - Destination location
     * @param {number} passengerCount - Number of passengers
     * @returns {Object} Fare calculation result
     */
    calculateFare(from, to, passengerCount = 2) {
        const pathResult = this.findShortestPath(from, to);
        
        if (!pathResult.valid) {
            throw new Error('No valid route found');
        }
        
        // Simple fare calculation: $5 per person
        const totalFare = this.campusData.calculateBaseFare(from, to, passengerCount);
        
        // Get cart size recommendation
        const cartInfo = this.campusData.getCartSizeRecommendation(passengerCount);
        
        return {
            baseFare: totalFare,
            totalFare: totalFare,
            estimatedTime: pathResult.time,
            distance: pathResult.distance,
            route: pathResult.route,
            passengerCount: passengerCount,
            cartSize: cartInfo.size,
            cartCapacity: cartInfo.capacity,
            cartDescription: cartInfo.description,
            ratePerPassenger: 5.00,
            paymentNote: "Payment collected after ride completion"
        };
    }

    /**
     * Get alternative routes
     * @param {string} start - Starting location
     * @param {string} end - Destination location
     * @param {number} maxAlternatives - Maximum number of alternatives
     * @returns {Array} Array of alternative routes
     */
    getAlternativeRoutes(start, end, maxAlternatives = 3) {
        const alternatives = [];
        const paths = this.campusData.getPaths();
        
        // Get direct neighbors of start location
        const startNeighbors = Object.keys(paths[start] || {});
        
        for (const neighbor of startNeighbors) {
            if (neighbor !== end) {
                try {
                    const pathToNeighbor = this.findShortestPath(start, neighbor);
                    const pathFromNeighbor = this.findShortestPath(neighbor, end);
                    
                    if (pathToNeighbor.valid && pathFromNeighbor.valid) {
                        const alternativeRoute = {
                            route: [...pathToNeighbor.route, ...pathFromNeighbor.route.slice(1)],
                            distance: pathToNeighbor.distance + pathFromNeighbor.distance,
                            time: pathToNeighbor.time + pathFromNeighbor.time,
                            cost: pathToNeighbor.cost + pathFromNeighbor.cost,
                            via: neighbor
                        };
                        
                        alternatives.push(alternativeRoute);
                    }
                } catch (error) {
                    // Skip invalid routes
                }
            }
        }
        
        // Sort by time and return top alternatives
        return alternatives
            .sort((a, b) => a.time - b.time)
            .slice(0, maxAlternatives);
    }

    /**
     * Validate route feasibility
     * @param {string} start - Starting location
     * @param {string} end - Destination location
     * @returns {Object} Validation result
     */
    validateRoute(start, end) {
        const validation = {
            valid: false,
            errors: [],
            warnings: []
        };
        
        // Check if locations exist
        if (!this.campusData.locationExists(start)) {
            validation.errors.push(`Start location "${start}" not found`);
        }
        
        if (!this.campusData.locationExists(end)) {
            validation.errors.push(`End location "${end}" not found`);
        }
        
        if (validation.errors.length > 0) {
            return validation;
        }
        
        // Check if route exists
        try {
            const pathResult = this.findShortestPath(start, end);
            
            if (!pathResult.valid) {
                validation.errors.push('No valid route found between locations');
            } else {
                validation.valid = true;
                
                // Add warnings for long routes
                if (pathResult.time > 15) {
                    validation.warnings.push('This is a long route (>15 minutes)');
                }
                
                if (pathResult.distance > 2) {
                    validation.warnings.push('This route covers significant distance (>2km)');
                }
            }
        } catch (error) {
            validation.errors.push(`Route calculation failed: ${error.message}`);
        }
        
        return validation;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortestPathAlgorithm;
}
