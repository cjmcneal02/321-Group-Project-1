// API Service to replace AppState with RESTful API calls
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5063/api'; // API server port
        this.currentDriverId = null; // Will be set when driver logs in
        this.currentUserId = null; // Will be set when user logs in
        this.currentUserRole = null; // Will be set when user logs in
    }

    // Ride Methods (Single Table Approach)
    async createRide(rideData) {
        try {
            // Ensure riderId and riderName are included from logged-in user
            const requestData = {
                ...rideData,
                RiderId: rideData.RiderId || this.getCurrentRiderId(),
                RiderName: rideData.RiderName || this.getCurrentUserName() || 'Anonymous Rider'
            };
            
            const response = await fetch(`${this.baseUrl}/rides`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating ride:', error);
            throw error;
        }
    }

    async getDriver(driverId) {
        try {
            const response = await fetch(`${this.baseUrl}/drivers/${driverId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching driver:', error);
            throw error;
        }
    }

    async getRide(rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/rides/${rideId}`);
            if (response.status === 404) {
                return null; // Ride not found
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching ride:', error);
            throw error;
        }
    }

    async getCurrentRiderActiveRide() {
        try {
            const riderId = this.getCurrentRiderId();
            if (!riderId) {
                return null;
            }
            
            const rides = await this.getRidesByRider(riderId, 'In Progress');
            console.log('Active rides for rider', riderId, ':', rides);
            return rides.length > 0 ? rides[0] : null;
        } catch (error) {
            console.error('Error fetching current rider active ride:', error);
            return null;
        }
    }

    async getRidesByRider(riderId, status = null) {
        try {
            let url = `${this.baseUrl}/rides/rider/${riderId}`;
            if (status) {
                url += `?status=${status}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rides by rider:', error);
            throw error;
        }
    }

    async cancelRide(rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/rides/${rideId}/cancel`, {
                method: 'PUT'
            });
            return response.ok;
        } catch (error) {
            console.error('Error cancelling ride:', error);
            throw error;
        }
    }

    async acceptRide(rideId, driverId) {
        try {
            const response = await fetch(`${this.baseUrl}/rides/${rideId}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ DriverId: driverId, RideId: rideId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // The endpoint returns NoContent (204), so we need to fetch the updated ride
            return await this.getRide(rideId);
        } catch (error) {
            console.error('Error accepting ride:', error);
            throw error;
        }
    }

    // Driver Methods
    async getDrivers() {
        try {
            const response = await fetch(`${this.baseUrl}/drivers`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching drivers:', error);
            throw error;
        }
    }

    async getAvailableDrivers() {
        try {
            const response = await fetch(`${this.baseUrl}/drivers/available`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching available drivers:', error);
            throw error;
        }
    }

    async updateDriverStatus(driverId, statusData) {
        try {
            const response = await fetch(`${this.baseUrl}/drivers/${driverId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(statusData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating driver status:', error);
            throw error;
        }
    }

    async updateDriverLocation(rideId, driverLocation) {
        try {
            const response = await fetch(`${this.baseUrl}/rides/${rideId}/driver-location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driverLocation })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text(); // NoContent response
        } catch (error) {
            console.error('Error updating driver location:', error);
            throw error;
        }
    }

    async completeRide(driverId, rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/rides/${rideId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ DriverId: driverId, RideId: rideId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // The endpoint returns NoContent (204), so we just return success
            return { success: true };
        } catch (error) {
            console.error('Error completing ride:', error);
            throw error;
        }
    }

    // Ride Methods
    async getRides() {
        try {
            const response = await fetch(`${this.baseUrl}/rides`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rides:', error);
            throw error;
        }
    }

    async getRidesByStatus(status) {
        try {
            const response = await fetch(`${this.baseUrl}/rides?status=${status}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rides by status:', error);
            throw error;
        }
    }

    async getActiveRide() {
        try {
            const response = await fetch(`${this.baseUrl}/rides/active`);
            if (response.status === 404) {
                return null; // No active ride
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching active ride:', error);
            throw error;
        }
    }


    async getRideHistory() {
        try {
            const response = await fetch(`${this.baseUrl}/rides/history`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allRides = await response.json();
            
            // If we're a rider, filter by rider ID
            if (this.currentUserRole === 'Rider') {
                const riderId = this.getCurrentRiderId();
                if (!riderId) {
                    return [];
                }
                
                const riderRides = allRides.filter(ride => {
                    const rideRiderId = ride.RiderId || ride.riderId;
                    return rideRiderId === riderId;
                });
                return riderRides;
            }
            
            // If we're a driver, return all rides (they'll be filtered on the frontend)
            return allRides;
        } catch (error) {
            console.error('Error fetching ride history:', error);
            throw error;
        }
    }

    // Rider Methods
    async getRiders() {
        try {
            const response = await fetch(`${this.baseUrl}/riders`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching riders:', error);
            throw error;
        }
    }

    async getRider(riderId) {
        try {
            const response = await fetch(`${this.baseUrl}/riders/${riderId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rider:', error);
            throw error;
        }
    }

    async getRiderByUserId(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/riders/user/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching rider by user ID:', error);
            throw error;
        }
    }

    async getRecentRides(riderId) {
        try {
            const response = await fetch(`${this.baseUrl}/riders/${riderId}/recent-rides`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching recent rides:', error);
            throw error;
        }
    }

    // Chat Methods
    async getChatMessages(rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/chatmessages/${rideId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            throw error;
        }
    }

    async sendChatMessage(messageData) {
        try {
            const response = await fetch(`${this.baseUrl}/chatmessages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    }

    async clearChatMessages(rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/chatmessages/${rideId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Error clearing chat messages:', error);
            throw error;
        }
    }

    // Helper method to find nearest available driver
    async findNearestDriver(pickupLocation) {
        try {
            const availableDrivers = await this.getAvailableDrivers();
            
            if (availableDrivers.length === 0) {
                return null;
            }

            // Simple distance calculation - in a real app, you'd use actual coordinates
            const locations = {
                'Hewson Hall': 1,
                'Presidential Village': 2,
                'Student Center': 3,
                'Library': 4,
                'Gymnasium': 5
            };

            const pickupValue = locations[pickupLocation] || 1;
            
            // Find driver with minimum distance
            let nearestDriver = availableDrivers[0];
            let minDistance = Math.abs((locations[nearestDriver.Location] || 1) - pickupValue);

            for (const driver of availableDrivers) {
                const distance = Math.abs((locations[driver.Location] || 1) - pickupValue);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestDriver = driver;
                }
            }

            return nearestDriver;
        } catch (error) {
            console.error('Error finding nearest driver:', error);
            throw error;
        }
    }

    // User Management Methods
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const user = await response.json();
            this.currentUserId = user.id;
            this.currentUserRole = user.role;
            
            // If user is a driver, set the driver ID
            if (user.role === 'Driver' && user.driver) {
                this.currentDriverId = user.driver.id;
            }

            return user;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    async getUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    async getUsersByRole(role) {
        try {
            const response = await fetch(`${this.baseUrl}/users/role/${role}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching users by role:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Get current user name based on logged-in user
     */
    getCurrentRiderId() {
        
        // For riders, get the rider ID from localStorage
        if (this.currentUserRole === 'Rider' && this.currentUserId) {
            const riderUser = localStorage.getItem('riderUser');
            if (riderUser) {
                const userData = JSON.parse(riderUser);
                const riderId = userData.riderId;
                return riderId;
            }
        }
        
        return null;
    }

    getCurrentUserName() {
        
        // For riders, we can get the name from the current user data
        if (this.currentUserRole === 'Rider' && this.currentUserId) {
            // Try to get name from localStorage first
            const riderUser = localStorage.getItem('riderUser');
            if (riderUser) {
                const userData = JSON.parse(riderUser);
                const name = userData.riderName || userData.firstName || 'Anonymous Rider';
                return name;
            }
            
            // Fallback to hardcoded mapping
            const riderNames = {
                4: 'James Wilson' // rider user ID
            };
            const fallbackName = riderNames[this.currentUserId] || 'Anonymous Rider';
            return fallbackName;
        }
        
        // For drivers, use hardcoded mapping
        if (this.currentUserRole === 'Driver' && this.currentDriverId) {
            const driverNames = {
                1: 'Stacy Streets', // stacy driver ID
                2: 'Sarah Smith'    // sarah driver ID
            };
            return driverNames[this.currentDriverId] || 'Anonymous Driver';
        }
        
        return 'Anonymous User';
    }

    logout() {
        this.currentUserId = null;
        this.currentUserRole = null;
        this.currentDriverId = null;
    }
}

// Initialize API service
const apiService = new ApiService();