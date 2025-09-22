// Driver Portal Interface - Integrated with AppState
class DriverPortal {
  constructor() {
    this.campusData = new CampusData();
    this.currentDriver = this.campusData.getDriverById('SC-001'); // Default driver
    this.isAvailable = this.currentDriver ? this.currentDriver.available : true;
    this.hasActiveRide = false;
    this.ridesCompleted = 0;
    this.earnings = 0;
    this.rating = this.currentDriver ? this.currentDriver.rating : 4.9;
    this.rideHistory = [];
    this.currentRide = null;
    this.rideMap = null;
    this.lastRequestCount = 0; // Track request count for polling
    
    // Check for AppState availability
    if (typeof appState === 'undefined') {
      console.warn('AppState not available. Some features may not work properly.');
    }
    
    this.initializeElements();
    this.bindEvents();
    this.updateUI();
    
    // Update requests UI immediately on load
    this.updateRequestsUI();
    
    // Start real-time polling for requests
    this.startRequestPolling();
  }

  initializeElements() {
    // Welcome elements
    this.welcomeMessage = document.getElementById('welcomeMessage');
    this.vehicleInfo = document.getElementById('vehicleInfo');
    this.statusBadge = document.getElementById('statusBadge');
    
    // Status elements
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusText = document.getElementById('statusText');
    this.statusSubtext = document.getElementById('statusSubtext');
    this.toggleStatusBtn = document.getElementById('toggleStatusBtn');
    
    // Ride elements
    this.startRideBtn = document.getElementById('startRideBtn');
    this.noRideState = document.getElementById('noRideState');
    this.activeRideState = document.getElementById('activeRideState');
    
    // Active ride elements
    this.passengerName = document.getElementById('passengerName');
    this.pickupLocation = document.getElementById('pickupLocation');
    this.dropoffLocation = document.getElementById('dropoffLocation');
    this.rideDistance = document.getElementById('rideDistance');
    this.rideFare = document.getElementById('rideFare');
    this.rideETA = document.getElementById('rideETA');
    this.rideProgress = document.getElementById('rideProgress');
    this.arrivedBtn = document.getElementById('arrivedBtn');
    this.startTripBtn = document.getElementById('startTripBtn');
    this.completeRideBtn = document.getElementById('completeRideBtn');
    
    // Stats elements
    this.ridesCompletedEl = document.getElementById('ridesCompleted');
    this.earningsEl = document.getElementById('earnings');
    this.ratingEl = document.getElementById('rating');
    this.totalEarningsEl = document.getElementById('totalEarnings');
    this.averageRatingEl = document.getElementById('averageRating');
    
    // Request elements
    this.noRequestsState = document.getElementById('noRequestsState');
    this.requestsList = document.getElementById('requestsList');
    
    // History elements
    this.rideHistoryTable = document.getElementById('rideHistoryTable');
  }

  bindEvents() {
    // Status toggle
    this.toggleStatusBtn.addEventListener('click', () => this.toggleStatus());
    
    // Active ride controls
    this.arrivedBtn.addEventListener('click', () => this.arrivedAtPickup());
    this.startTripBtn.addEventListener('click', () => this.startTrip());
    this.completeRideBtn.addEventListener('click', () => this.completeRide());
  }

  initializeChatInterface() {
    // Chat interface will be created dynamically when ride is accepted
  }

  toggleStatus() {
    this.isAvailable = !this.isAvailable;
    
    // Update campus data
    this.campusData.updateDriverAvailability(this.currentDriver.id, this.isAvailable);
    
    this.updateUI();
    
    if (this.isAvailable) {
      this.showNotification('You are now available and ready to accept rides!', 'success');
    } else {
      this.showNotification('You are now unavailable', 'info');
    }
  }


  calculateDistance(from, to) {
    const paths = this.campusData.getPaths();
    return paths[from] && paths[from][to] ? paths[from][to] : 5;
  }

  showChatInterface(rideId) {
    // Create chat interface if it doesn't exist
    let chatContainer = document.getElementById('driver-chat-container');
    if (!chatContainer) {
      chatContainer = document.createElement('div');
      chatContainer.id = 'driver-chat-container';
      chatContainer.className = 'chat-container mt-3';
      chatContainer.innerHTML = `
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0"><i class="bi bi-chat-dots me-2"></i>Rider Communication</h6>
            <button class="btn btn-sm btn-outline-secondary" onclick="driverPortal.hideChatInterface()">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="card-body p-0">
            <div class="quick-chat-buttons p-3 border-bottom">
              <div class="row g-2">
                <div class="col-6">
                  <button class="btn btn-outline-primary btn-sm w-100" onclick="driverPortal.sendQuickMessage('${rideId}', 'On my way!')">
                    <i class="bi bi-car-front me-1"></i>On my way!
                  </button>
                </div>
                <div class="col-6">
                  <button class="btn btn-outline-primary btn-sm w-100" onclick="driverPortal.sendQuickMessage('${rideId}', '2 minutes away')">
                    <i class="bi bi-clock me-1"></i>2 min away
                  </button>
                </div>
                <div class="col-6">
                  <button class="btn btn-outline-primary btn-sm w-100" onclick="driverPortal.sendQuickMessage('${rideId}', 'I have arrived')">
                    <i class="bi bi-geo-alt me-1"></i>I have arrived
                  </button>
                </div>
                <div class="col-6">
                  <button class="btn btn-outline-primary btn-sm w-100" onclick="driverPortal.sendQuickMessage('${rideId}', 'Starting trip now')">
                    <i class="bi bi-play me-1"></i>Starting trip
                  </button>
                </div>
              </div>
            </div>
            <div id="driver-chat-messages" class="chat-messages p-3" style="height: 200px; overflow-y: auto;">
              <!-- Messages will be loaded here -->
            </div>
            <div class="chat-input p-3 border-top">
              <div class="input-group">
                <input type="text" id="driver-chat-input" class="form-control" placeholder="Type a message...">
                <button class="btn btn-primary" id="driver-send-message-btn">
                  <i class="bi bi-send"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Insert after active ride state
      const activeRideState = document.getElementById('activeRideState');
      if (activeRideState) {
        activeRideState.appendChild(chatContainer);
      }
      
      // Bind chat events
      this.bindDriverChatEvents(rideId);
    }
    
    // Load existing messages
    this.loadDriverChatMessages(rideId);
    
    // Start polling for new messages
    this.startDriverChatPolling(rideId);
  }

  updateActiveRideDisplay() {
    if (!this.currentRide) return;

    this.passengerName.textContent = this.currentRide.riderName;
    this.pickupLocation.textContent = this.currentRide.pickupLocation;
    this.dropoffLocation.textContent = this.currentRide.dropoffLocation;
    this.rideDistance.textContent = `${this.currentRide.distance} min`;
    this.rideFare.textContent = `$${this.currentRide.estimatedFare.toFixed(2)}`;
    this.rideETA.textContent = `${this.currentRide.distance} min`;
  }

  arrivedAtPickup() {
    this.arrivedBtn.disabled = true;
    this.startTripBtn.disabled = false;
    this.arrivedBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Arrived';
    this.arrivedBtn.classList.remove('btn-success');
    this.arrivedBtn.classList.add('btn-outline-success');
    this.showNotification('Arrived at pickup location', 'info');
  }

  startTrip() {
    this.startTripBtn.disabled = true;
    this.completeRideBtn.disabled = false;
    this.startTripBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Trip Started';
    this.startTripBtn.classList.remove('btn-primary');
    this.startTripBtn.classList.add('btn-outline-primary');
    
    // Start progress simulation
    this.simulateRideProgress();
    this.showNotification('Trip started - heading to destination', 'info');
  }

  simulateRideProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      this.rideProgress.style.width = progress + '%';
    }, 1000);
  }

  completeRide() {
    if (!this.currentRide) return;

    // Update stats
    this.ridesCompleted++;
    this.earnings += this.currentRide.estimatedFare;
    
    // Add to ride history
    this.rideHistory.unshift({
      time: new Date(this.currentRide.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      passenger: this.currentRide.riderName,
      route: `${this.currentRide.pickupLocation} → ${this.currentRide.dropoffLocation}`,
      distance: `${this.currentRide.distance} min`,
      fare: `$${this.currentRide.estimatedFare.toFixed(2)}`,
      status: 'Completed'
    });

    // Update AppState - clear active ride and make driver available
    if (typeof appState !== 'undefined') {
      // Log completed ride to history before clearing
      appState.addRideToHistory(this.currentRide);
      
      // Send completion message to rider
      const completionMessage = {
        rideId: this.currentRide.id,
        sender: 'driver',
        senderName: this.currentDriver.name,
        content: 'Ride completed! Please confirm completion.'
      };
      appState.addChatMessage(completionMessage);
      
      appState.setActiveRide(null);
      appState.updateDriver(this.currentDriver.id, {
        available: true,
        currentRide: null
      });
    }
    
    // Hide chat interface
    this.hideChatInterface();
    
    // Reset ride state
    this.hasActiveRide = false;
    this.currentRide = null;
    this.arrivedBtn.disabled = false;
    this.startTripBtn.disabled = true;
    this.completeRideBtn.disabled = true;
    
    // Reset button states
    this.arrivedBtn.innerHTML = '<i class="bi bi-geo-alt me-2"></i>Arrived at Pickup';
    this.arrivedBtn.classList.remove('btn-outline-success');
    this.arrivedBtn.classList.add('btn-success');
    
    this.startTripBtn.innerHTML = '<i class="bi bi-play me-2"></i>Start Trip';
    this.startTripBtn.classList.remove('btn-outline-primary');
    this.startTripBtn.classList.add('btn-primary');
    
    this.rideProgress.style.width = '0%';
    
    this.updateUI();
    this.updateRideHistory();
    this.showNotification(`Ride completed! Earned $${this.currentRide?.estimatedFare.toFixed(2) || '0.00'}`, 'success');
  }

  /**
   * Start real-time polling for ride requests
   */
  startRequestPolling() {
    // Check for requests every 1 second for faster updates
    this.requestPollingInterval = setInterval(() => {
      this._checkForRequests();
    }, 1000);
  }

  /**
   * Check for new ride requests from AppState
   * @private
   */
  _checkForRequests() {
    if (typeof appState === 'undefined') return;
    
    const requests = appState.getRideRequests();
    const currentRequestCount = requests.length;
    
    // Check if requests have changed
    if (currentRequestCount !== this.lastRequestCount) {
      this.lastRequestCount = currentRequestCount;
      this.updateRequestsUI();
      
      // Show notification for new requests
      if (currentRequestCount > 0) {
        this.showNotification('New ride request received!', 'info');
      }
    }
  }

  acceptRequest(requestId) {
    if (typeof appState === 'undefined') {
      this.showNotification('System unavailable. Please try again later.', 'danger');
      return;
    }
    
    // Find the request in AppState
    const requests = appState.getRideRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) {
      this.showNotification('Request not found or already processed', 'warning');
      return;
    }
    
    // Create new active ride object
    const newActiveRide = {
      id: 'RIDE-' + requestId,
      riderName: request.riderName,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      passengerCount: request.passengerCount,
      cartSize: request.cartSize,
      estimatedFare: request.estimatedFare,
      driverId: this.currentDriver.id,
      driverName: this.currentDriver.name,
      status: 'accepted',
      startTime: new Date().toISOString(),
      distance: this.calculateDistance(request.pickupLocation, request.dropoffLocation)
    };
    
    // Set as active ride in AppState
    appState.setActiveRide(newActiveRide);
    
    // Update driver status to unavailable
    appState.updateDriver(this.currentDriver.id, {
      available: false,
      currentRide: newActiveRide.id
    });
    
    // Remove the request from the list
    appState.removeRideRequest(requestId);
    
    // Update local state
    this.currentRide = newActiveRide;
    this.hasActiveRide = true;
    this.updateActiveRideDisplay();
    this.updateUI();
    this.updateRequestsUI();
    this.showChatInterface(newActiveRide.id);
    this.showNotification(`Accepted ride for ${request.riderName}`, 'success');
  }

  declineRequest(requestId) {
    if (typeof appState === 'undefined') {
      this.showNotification('System unavailable. Please try again later.', 'danger');
      return;
    }
    
    // Remove the request from AppState
    appState.removeRideRequest(requestId);
    
    // Update UI
    this.updateRequestsUI();
    this.showNotification('Ride request declined', 'warning');
  }

  updateUI() {
    // Update welcome message
    if (this.currentDriver) {
      this.welcomeMessage.textContent = `${this.currentDriver.name}`;
      this.vehicleInfo.textContent = `${this.currentDriver.vehicle} #${this.currentDriver.id}`;
    }
    
    // Update status
    if (this.isAvailable) {
      this.statusIndicator.className = 'driver-status-indicator';
      this.statusText.textContent = 'Available';
      this.statusSubtext.textContent = 'Ready to accept rides';
      this.toggleStatusBtn.innerHTML = '<i class="bi bi-power me-2"></i>Go Unavailable';
      this.toggleStatusBtn.className = 'btn btn-outline-danger';
      this.statusBadge.textContent = 'Available';
      this.statusBadge.className = 'badge bg-success fs-6';
    } else {
      this.statusIndicator.className = 'driver-status-indicator offline';
      this.statusText.textContent = 'Unavailable';
      this.statusSubtext.textContent = 'Not accepting rides';
      this.toggleStatusBtn.innerHTML = '<i class="bi bi-power me-2"></i>Go Available';
      this.toggleStatusBtn.className = 'btn btn-outline-success';
      this.statusBadge.textContent = 'Unavailable';
      this.statusBadge.className = 'badge bg-danger fs-6';
    }
    
    // Update ride state
    if (this.hasActiveRide) {
      this.noRideState.classList.add('d-none');
      this.activeRideState.classList.remove('d-none');
      this.startRideBtn.disabled = true;
    } else {
      this.noRideState.classList.remove('d-none');
      this.activeRideState.classList.add('d-none');
      this.startRideBtn.disabled = false;
    }
    
    // Update stats
    this.ridesCompletedEl.textContent = this.ridesCompleted;
    this.earningsEl.textContent = `$${this.earnings.toFixed(2)}`;
    this.ratingEl.textContent = this.rating.toFixed(1);
    this.totalEarningsEl.textContent = `$${this.earnings.toFixed(2)}`;
    this.averageRatingEl.textContent = this.rating.toFixed(1);
  }

  updateRequestsUI() {
    if (typeof appState === 'undefined') {
      this.noRequestsState.classList.remove('d-none');
      this.requestsList.classList.add('d-none');
      return;
    }
    
    const requests = appState.getRideRequests();
    
    if (requests.length === 0) {
      this.noRequestsState.classList.remove('d-none');
      this.requestsList.classList.add('d-none');
      return;
    }
    
    this.noRequestsState.classList.add('d-none');
    this.requestsList.classList.remove('d-none');
    
    // Clear the list completely before rebuilding
    this.requestsList.innerHTML = '';
    
    // Deduplicate requests by ID to prevent duplicates
    const uniqueRequests = requests.filter((request, index, self) => 
      index === self.findIndex(r => r.id === request.id)
    );
    
    this.requestsList.innerHTML = uniqueRequests.map(request => {
      const requestTime = new Date(request.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const distance = this.calculateDistance(request.pickupLocation, request.dropoffLocation);
      
      return `
        <div class="ride-request-card card mb-3 fade-in">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-title mb-0">${request.riderName}</h6>
                  <span class="badge bg-secondary">${requestTime}</span>
                </div>
                <div class="row text-muted small">
                  <div class="col-6">
                    <i class="bi bi-geo-alt me-1"></i>From: ${request.pickupLocation}
                  </div>
                  <div class="col-6">
                    <i class="bi bi-geo-alt-fill me-1"></i>To: ${request.dropoffLocation}
                  </div>
                </div>
                <div class="row text-muted small mt-1">
                  <div class="col-6">
                    <i class="bi bi-people me-1"></i>${request.passengerCount} passengers
                  </div>
                  <div class="col-6">
                    <i class="bi bi-currency-dollar me-1"></i>$${request.estimatedFare.toFixed(2)}
                  </div>
                </div>
                <div class="row text-muted small mt-1">
                  <div class="col-6">
                    <i class="bi bi-car-front me-1"></i>${request.cartSize}
                  </div>
                  <div class="col-6">
                    <i class="bi bi-arrow-right me-1"></i>${distance} min
                  </div>
                </div>
              </div>
              <div class="col-md-4 text-end">
                <div class="btn-group">
                  <button class="btn btn-success btn-sm" onclick="driverPortal.acceptRequest('${request.id}')">
                    <i class="bi bi-check"></i> Accept
                  </button>
                  <button class="btn btn-outline-danger btn-sm" onclick="driverPortal.declineRequest('${request.id}')">
                    <i class="bi bi-x"></i> Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateRideHistory() {
    if (this.rideHistory.length === 0) {
      this.rideHistoryTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-clock-history me-2"></i>No completed rides yet
          </td>
        </tr>
      `;
      return;
    }

    this.rideHistoryTable.innerHTML = this.rideHistory.map(ride => `
      <tr>
        <td>${ride.time}</td>
        <td>${ride.passenger}</td>
        <td>${ride.route}</td>
        <td>${ride.distance}</td>
        <td>${ride.fare}</td>
        <td><span class="badge bg-success">${ride.status}</span></td>
      </tr>
    `).join('');
  }

  /**
   * Hide chat interface
   */
  hideChatInterface() {
    const chatContainer = document.getElementById('driver-chat-container');
    if (chatContainer) {
      chatContainer.remove();
    }
    this.stopDriverChatPolling();
  }

  /**
   * Bind driver chat events
   * @param {string} rideId - Active ride ID
   */
  bindDriverChatEvents(rideId) {
    const sendBtn = document.getElementById('driver-send-message-btn');
    const chatInput = document.getElementById('driver-chat-input');
    
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => this.sendDriverMessage(rideId));
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendDriverMessage(rideId);
        }
      });
    }
  }

  /**
   * Send a quick message
   * @param {string} rideId - Active ride ID
   * @param {string} message - Quick message content
   */
  sendQuickMessage(rideId, message) {
    const messageObj = {
      rideId: rideId,
      sender: 'driver',
      senderName: this.currentDriver.name,
      content: message
    };
    
    appState.addChatMessage(messageObj);
    this.loadDriverChatMessages(rideId);
  }

  /**
   * Send a driver chat message
   * @param {string} rideId - Active ride ID
   */
  sendDriverMessage(rideId) {
    const chatInput = document.getElementById('driver-chat-input');
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = {
      rideId: rideId,
      sender: 'driver',
      senderName: this.currentDriver.name,
      content: chatInput.value.trim()
    };
    
    appState.addChatMessage(message);
    chatInput.value = '';
    this.loadDriverChatMessages(rideId);
  }

  /**
   * Load driver chat messages
   * @param {string} rideId - Active ride ID
   */
  loadDriverChatMessages(rideId) {
    const messagesContainer = document.getElementById('driver-chat-messages');
    if (!messagesContainer) return;
    
    const messages = appState.getChatMessages(rideId);
    messagesContainer.innerHTML = messages.map(msg => `
      <div class="message ${msg.sender === 'driver' ? 'text-end' : 'text-start'} mb-2">
        <div class="d-inline-block p-2 rounded ${msg.sender === 'driver' ? 'bg-primary text-white' : 'bg-light'}">
          <small class="d-block text-muted">${msg.senderName}</small>
          ${msg.content}
        </div>
      </div>
    `).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Start polling for driver chat messages
   * @param {string} rideId - Active ride ID
   */
  startDriverChatPolling(rideId) {
    this.stopDriverChatPolling();
    this.driverChatPollingInterval = setInterval(() => {
      this.loadDriverChatMessages(rideId);
    }, 1000);
  }

  /**
   * Stop polling for driver chat messages
   */
  stopDriverChatPolling() {
    if (this.driverChatPollingInterval) {
      clearInterval(this.driverChatPollingInterval);
      this.driverChatPollingInterval = null;
    }
  }

  /**
   * Manually refresh requests list
   */
  refreshRequests() {
    this.updateRequestsUI();
    this.showNotification('Requests refreshed', 'info');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize the driver portal when the page loads
let driverPortal;
document.addEventListener('DOMContentLoaded', () => {
  driverPortal = new DriverPortal();
});

// Make driverPortal globally available
window.driverPortal = driverPortal;