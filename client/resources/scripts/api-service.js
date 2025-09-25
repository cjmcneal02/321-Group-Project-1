// API Service to replace AppState with RESTful API calls
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5063/api'; // API server port
        this.currentDriverId = 1; // Default driver ID for testing
    }

    // Ride Request Methods
    async createRideRequest(rideData) {
        try {
            console.log('Sending ride request to API:', rideData);
            console.log('JSON string being sent:', JSON.stringify(rideData));
            const response = await fetch(`${this.baseUrl}/riderequests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rideData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating ride request:', error);
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

    async getRideRequests() {
        try {
            const response = await fetch(`${this.baseUrl}/riderequests`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching ride requests:', error);
            throw error;
        }
    }

    async deleteRideRequest(requestId) {
        try {
            const response = await fetch(`${this.baseUrl}/riderequests/${requestId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting ride request:', error);
            throw error;
        }
    }

    async acceptRideRequest(requestId, driverId) {
        try {
            const response = await fetch(`${this.baseUrl}/riderequests/${requestId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driverId, rideRequestId: requestId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error accepting ride request:', error);
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

    async updateDriverStatus(driverId, isAvailable) {
        try {
            const response = await fetch(`${this.baseUrl}/drivers/${driverId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isAvailable })
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

    async completeRide(driverId, rideId) {
        try {
            const response = await fetch(`${this.baseUrl}/drivers/${driverId}/complete-ride`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driverId, rideId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
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
            return await response.json();
        } catch (error) {
            console.error('Error fetching ride history:', error);
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

    async sendChatMessage(rideId, sender, senderName, content) {
        try {
            const response = await fetch(`${this.baseUrl}/chatmessages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rideId,
                    sender,
                    senderName,
                    content
                })
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
}

// Initialize API service
const apiService = new ApiService();