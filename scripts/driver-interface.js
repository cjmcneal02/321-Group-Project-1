// Driver Portal Interface - Integrated with CampusData
class DriverPortal {
  constructor() {
    this.campusData = new CampusData();
    this.currentDriver = this.campusData.getDriverById('SC-001'); // Default driver
    this.isAvailable = this.currentDriver ? this.currentDriver.available : true;
    this.hasActiveRide = false;
    this.ridesCompleted = 0;
    this.earnings = 0;
    this.rating = this.currentDriver ? this.currentDriver.rating : 4.9;
    this.requests = [];
    this.rideHistory = [];
    this.currentRide = null;
    this.rideMap = null;
    
    this.initializeElements();
    this.bindEvents();
    this.updateUI();
    this.initializeMap();
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
    this.demoRideBtn = document.getElementById('demoRideBtn');
    
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
    this.demoRequestBtn = document.getElementById('demoRequestBtn');
    
    // History elements
    this.rideHistoryTable = document.getElementById('rideHistoryTable');
  }

  bindEvents() {
    // Status toggle
    this.toggleStatusBtn.addEventListener('click', () => this.toggleStatus());
    
    // Demo ride
    this.demoRideBtn.addEventListener('click', () => this.startDemoRide());
    
    // Active ride controls
    this.arrivedBtn.addEventListener('click', () => this.arrivedAtPickup());
    this.startTripBtn.addEventListener('click', () => this.startTrip());
    this.completeRideBtn.addEventListener('click', () => this.completeRide());
    
    // Demo request
    this.demoRequestBtn.addEventListener('click', () => this.generateDemoRequest());
  }

  initializeMap() {
    if (typeof L !== 'undefined') {
      this.rideMap = L.map('rideMap').setView([33.209717, -87.546836], 16);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.rideMap);
    }
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

  startDemoRide() {
    if (!this.isAvailable) {
      this.showNotification('Please go available first to start a ride', 'warning');
      return;
    }

    // Create a demo ride with real campus locations
    const locations = Object.keys(this.campusData.getLocations());
    const pickup = locations[Math.floor(Math.random() * locations.length)];
    let dropoff = locations[Math.floor(Math.random() * locations.length)];
    
    // Ensure different pickup and dropoff
    while (dropoff === pickup) {
      dropoff = locations[Math.floor(Math.random() * locations.length)];
    }

    this.currentRide = {
      id: 'RIDE-' + Date.now(),
      passengerName: 'Demo Passenger',
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      distance: this.calculateDistance(pickup, dropoff),
      fare: this.campusData.calculateBaseFare(pickup, dropoff),
      startTime: new Date()
    };

    this.hasActiveRide = true;
    this.updateActiveRideDisplay();
    this.updateUI();
    this.showMapRoute();
    this.showNotification('Demo ride started!', 'success');
  }

  calculateDistance(from, to) {
    const paths = this.campusData.getPaths();
    return paths[from] && paths[from][to] ? paths[from][to] : 5;
  }

  showMapRoute() {
    if (!this.rideMap || !this.currentRide) return;

    const pickupCoords = this.campusData.getLocationCoordinates(this.currentRide.pickupLocation);
    const dropoffCoords = this.campusData.getLocationCoordinates(this.currentRide.dropoffLocation);

    if (pickupCoords && dropoffCoords) {
      // Clear existing markers
      this.rideMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          this.rideMap.removeLayer(layer);
        }
      });

      // Add pickup marker
      L.marker([pickupCoords.lat, pickupCoords.lng])
        .addTo(this.rideMap)
        .bindPopup(`Pickup: ${this.currentRide.pickupLocation}`);

      // Add dropoff marker
      L.marker([dropoffCoords.lat, dropoffCoords.lng])
        .addTo(this.rideMap)
        .bindPopup(`Dropoff: ${this.currentRide.dropoffLocation}`);

      // Fit map to show both markers
      const group = new L.featureGroup([
        L.marker([pickupCoords.lat, pickupCoords.lng]),
        L.marker([dropoffCoords.lat, dropoffCoords.lng])
      ]);
      this.rideMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  updateActiveRideDisplay() {
    if (!this.currentRide) return;

    this.passengerName.textContent = this.currentRide.passengerName;
    this.pickupLocation.textContent = this.currentRide.pickupLocation;
    this.dropoffLocation.textContent = this.currentRide.dropoffLocation;
    this.rideDistance.textContent = `${this.currentRide.distance} min`;
    this.rideFare.textContent = `$${this.currentRide.fare.toFixed(2)}`;
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
    this.earnings += this.currentRide.fare;
    
    // Add to ride history
    this.rideHistory.unshift({
      time: this.currentRide.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      passenger: this.currentRide.passengerName,
      route: `${this.currentRide.pickupLocation} → ${this.currentRide.dropoffLocation}`,
      distance: `${this.currentRide.distance} min`,
      fare: `$${this.currentRide.fare.toFixed(2)}`,
      status: 'Completed'
    });

    // Update campus data
    this.campusData.updateDriverAvailability(this.currentDriver.id, true, null);
    
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
    this.showNotification(`Ride completed! Earned $${this.currentRide?.fare.toFixed(2) || '0.00'}`, 'success');
  }

  generateDemoRequest() {
    const locations = Object.keys(this.campusData.getLocations());
    const names = [
      'Alex Chen', 'Maria Rodriguez', 'Jordan Smith', 'Taylor Johnson',
      'Casey Brown', 'Riley Davis', 'Morgan Wilson', 'Avery Miller'
    ];
    
    const pickup = locations[Math.floor(Math.random() * locations.length)];
    let dropoff = locations[Math.floor(Math.random() * locations.length)];
    
    // Ensure different pickup and dropoff
    while (dropoff === pickup) {
      dropoff = locations[Math.floor(Math.random() * locations.length)];
    }
    
    const request = {
      id: Date.now(),
      passengerName: names[Math.floor(Math.random() * names.length)],
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      distance: this.calculateDistance(pickup, dropoff),
      fare: this.campusData.calculateBaseFare(pickup, dropoff),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    this.requests.push(request);
    this.updateRequestsUI();
    this.showNotification('New ride request received!', 'info');
  }

  acceptRequest(requestId) {
    const requestIndex = this.requests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = this.requests[requestIndex];
    
    // Update request status
    request.status = 'accepted';
    
    // Start the ride with this request's details
    this.currentRide = {
      id: 'RIDE-' + requestId,
      passengerName: request.passengerName,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      distance: request.distance,
      fare: request.fare,
      startTime: new Date()
    };
    
    this.hasActiveRide = true;
    this.updateActiveRideDisplay();
    this.updateUI();
    this.updateRequestsUI();
    this.showMapRoute();
    this.showNotification(`Accepted ride for ${request.passengerName}`, 'success');
  }

  declineRequest(requestId) {
    const requestIndex = this.requests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    this.requests[requestIndex].status = 'declined';
    this.updateRequestsUI();
    this.showNotification('Ride request declined', 'warning');
  }

  updateUI() {
    // Update welcome message
    if (this.currentDriver) {
      this.welcomeMessage.textContent = `Welcome, ${this.currentDriver.name}`;
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
    if (this.requests.length === 0) {
      this.noRequestsState.classList.remove('d-none');
      this.requestsList.classList.add('d-none');
      return;
    }
    
    this.noRequestsState.classList.add('d-none');
    this.requestsList.classList.remove('d-none');
    
    this.requestsList.innerHTML = this.requests.map(request => {
      const statusClass = request.status === 'accepted' ? 'accepted' : 
                         request.status === 'declined' ? 'declined' : '';
      
      return `
        <div class="ride-request-card card mb-3 ${statusClass} fade-in">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-title mb-0">${request.passengerName}</h6>
                  <span class="badge bg-secondary">${request.time}</span>
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
                    <i class="bi bi-arrow-right me-1"></i>${request.distance} min
                  </div>
                  <div class="col-6">
                    <i class="bi bi-currency-dollar me-1"></i>$${request.fare.toFixed(2)}
                  </div>
                </div>
              </div>
              <div class="col-md-4 text-end">
                ${request.status === 'accepted' ? 
                  '<span class="badge bg-success">Accepted</span>' :
                  request.status === 'declined' ?
                  '<span class="badge bg-danger">Declined</span>' :
                  `<div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="driverPortal.acceptRequest(${request.id})">
                      <i class="bi bi-check"></i> Accept
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="driverPortal.declineRequest(${request.id})">
                      <i class="bi bi-x"></i> Decline
                    </button>
                  </div>`
                }
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
  
  // Add some demo data
  setTimeout(() => {
    driverPortal.generateDemoRequest();
  }, 2000);
  
  setTimeout(() => {
    driverPortal.generateDemoRequest();
  }, 5000);
});

// Make driverPortal globally available
window.driverPortal = driverPortal;