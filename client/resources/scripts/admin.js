// Admin Dashboard - Legacy AppState Version (Not used in API flow)
let dashboardPollingInterval = null;

function formatCurrency(amount) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'Active': return 'bg-success';
    case 'On Ride': return 'bg-warning';
    case 'Offline': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function renderDriverList(drivers, sortBy = 'rating') {
  const list = document.getElementById('driver-list');
  if (!list) return;
  
  list.innerHTML = '';

  // Sort the drivers based on the selected criteria
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (sortBy === 'avgTip') {
      return b.avgTip - a.avgTip; // Highest tip first
    }
    return b.rating - a.rating; // Highest rating first
  });

  sortedDrivers.forEach((driver) => {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3">
          <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
            <i class="bi bi-person-fill text-white"></i>
          </div>
        </div>
        <div>
          <h6 class="mb-1">${driver.name}</h6>
          <small class="text-muted">Solar Cart #${driver.id}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="text-center">
          <div class="fw-bold text-primary">${driver.rating}</div>
          <small class="text-muted">Rating</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-success">$${driver.avgTip.toFixed(2)}</div>
          <small class="text-muted">Avg Tip</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-info">${driver.totalRides}</div>
          <small class="text-muted">Rides</small>
        </div>
        <span class="badge ${getStatusBadgeClass(driver.status)}">${driver.status}</span>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderDashboard() {
  if (typeof appState === 'undefined') {
    console.warn('AppState not available');
    return;
  }

  // Get live data from AppState
  const drivers = appState.getDrivers();
  const activeRide = appState.getActiveRide();
  const rideRequests = appState.getRideRequests();

  // Update driver list with live data
  const driversWithStatus = drivers.map(driver => ({
    ...driver,
    status: driver.available ? 'Active' : 'On Ride'
  }));

  // Get current sort selection
  const sortSelect = document.getElementById('driver-sort');
  const currentSort = sortSelect ? sortSelect.value : 'rating';
  
  renderDriverList(driversWithStatus, currentSort);

  // Update monthly summary banner
  updateMonthlySummary(driversWithStatus, activeRide, rideRequests);
}

function updateMonthlySummary(drivers, activeRide, rideRequests) {
  const summaryBanner = document.getElementById('summary-banner');
  if (!summaryBanner) return;

  const activeDrivers = drivers.filter(driver => driver.status === 'Active').length;
  const onRideDrivers = drivers.filter(driver => driver.status === 'On Ride').length;
  const pendingRequests = rideRequests.length;

  // Get ride history for metrics
  const rideHistory = appState.getRideHistory();
  const totalRidesCompleted = rideHistory.length;
  const totalRevenue = rideHistory.reduce((sum, ride) => sum + (ride.estimatedFare || 0), 0);

  summaryBanner.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-graph-up me-3 fs-4" style="color: var(--primary-green);"></i>
      <div>
        <h6 class="mb-1 fw-bold">Live Platform Status</h6>
        <div class="row text-center">
          <div class="col-2">
            <div class="fw-bold text-primary">${activeDrivers}</div>
            <small class="text-muted">Available</small>
          </div>
          <div class="col-2">
            <div class="fw-bold text-warning">${onRideDrivers}</div>
            <small class="text-muted">On Ride</small>
          </div>
          <div class="col-2">
            <div class="fw-bold text-info">${pendingRequests}</div>
            <small class="text-muted">Pending</small>
          </div>
          <div class="col-3">
            <div class="fw-bold text-success">${totalRidesCompleted}</div>
            <small class="text-muted">Total Rides</small>
          </div>
          <div class="col-3">
            <div class="fw-bold text-success">$${totalRevenue.toFixed(2)}</div>
            <small class="text-muted">Total Revenue</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRiderList() {
  // Rider list is already populated in HTML, so we don't need to modify it
  // This function is kept for compatibility with the existing event handlers
  console.log('Rider list rendered');
}

function initEvents() {
  const sortSelect = document.getElementById('driver-sort');

  // Sort dropdown functionality
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderDashboard(); // Re-render with new sort order
    });
  }
}

function startDashboardPolling() {
  // Start polling every 3 seconds
  dashboardPollingInterval = setInterval(() => {
    renderDashboard();
  }, 3000);
}

function stopDashboardPolling() {
  if (dashboardPollingInterval) {
    clearInterval(dashboardPollingInterval);
    dashboardPollingInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the dashboard with live data
  renderDashboard();
  
  // Initialize event listeners
  initEvents();
  
  // Start live polling
  startDashboardPolling();
});

// Clean up polling when page is unloaded
window.addEventListener('beforeunload', () => {
  stopDashboardPolling();
});


