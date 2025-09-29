// Admin Dashboard - API Version
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

async function renderDriverList(drivers, sortBy = 'rating') {
  const list = document.getElementById('driver-list');
  if (!list) return;
  
  list.innerHTML = '';

  // Sort the drivers based on the selected criteria
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (sortBy === 'avgTip') {
      return b.averageTip - a.averageTip; // Highest tip first
    }
    return b.rating - a.rating; // Highest rating first
  });

  // Get real-time rating data for each driver
  for (const driver of sortedDrivers) {
    try {
      const ratingStats = await apiService.getDriverRatingStats(driver.id);
      driver.rating = ratingStats.averageRating || driver.rating || 0;
      driver.totalRatings = ratingStats.totalRatings || 0;
    } catch (error) {
      console.warn(`Could not fetch rating stats for driver ${driver.id}:`, error);
    }
  }

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
          <h6 class="mb-1">${driver.name || driver.Name}</h6>
          <small class="text-muted">Solar Cart #${driver.vehicleId || driver.VehicleId}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="text-center">
          <div class="fw-bold text-primary">${driver.rating.toFixed(1)}</div>
          <small class="text-muted">Rating (${driver.totalRatings || 0})</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-success">$${(driver.averageTip || driver.AverageTip || 0).toFixed(2)}</div>
          <small class="text-muted">Avg Tip</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-info">${driver.totalRides || driver.TotalRides || 0}</div>
          <small class="text-muted">Rides</small>
        </div>
        <span class="badge ${getStatusBadgeClass(driver.isAvailable ? 'Active' : 'Offline')}">${driver.isAvailable ? 'Active' : 'Offline'}</span>
      </div>
    `;
    list.appendChild(item);
  });
}

async function renderDashboard() {
  try {
    // Check if API service is available
    if (typeof apiService === 'undefined') {
      console.warn('ApiService not available');
      return;
    }

    // Get live data from API
    const drivers = await apiService.getDrivers();
    const rides = await apiService.getRides();
    const riders = await apiService.getRiders();

    // Get current sort selection
    const sortSelect = document.getElementById('driver-sort');
    const currentSort = sortSelect ? sortSelect.value : 'rating';
    
    // Update driver list with live data
    await renderDriverList(drivers, currentSort);

    // Update rider list with live data
    await renderRiderList(riders);

    // Update monthly summary banner
    await updateMonthlySummary(drivers, rides, riders);

  } catch (error) {
    console.error('Error rendering dashboard:', error);
  }
}

async function updateMonthlySummary(drivers, rides, riders) {
  const summaryBanner = document.getElementById('summary-banner');
  if (!summaryBanner) return;

  const activeDrivers = drivers.filter(driver => driver.isAvailable).length;
  const onRideDrivers = drivers.filter(driver => !driver.isAvailable).length;
  const pendingRequests = rides.filter(ride => ride.status === 'Requested').length;
  const totalRidesCompleted = rides.filter(ride => ride.status === 'Completed').length;
  const totalRevenue = rides
    .filter(ride => ride.status === 'Completed')
    .reduce((sum, ride) => sum + (ride.estimatedFare || 0), 0);

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

async function renderRiderList(riders) {
  try {
    // Group riders by status
    const vipRiders = riders.filter(rider => rider.riderStatus === 'VIP');
    const regularRiders = riders.filter(rider => rider.riderStatus === 'Regular');
    const newRiders = riders.filter(rider => rider.riderStatus === 'New');

    // Render VIP riders
    await renderRiderGroup('rider-list-vip', vipRiders);
    
    // Render Regular riders
    await renderRiderGroup('rider-list-regular', regularRiders);
    
    // Render New riders
    await renderRiderGroup('rider-list-new', newRiders);
    
  } catch (error) {
    console.error('Error loading riders:', error);
  }
}

async function renderRiderGroup(containerId, riders) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';

  for (const rider of riders) {
    try {
      // Get real-time rating data for each rider
      const ratingStats = await apiService.getRiderRatingStats(rider.id);
      rider.averageRating = ratingStats.averageRating || rider.averageRating || 0;
      rider.totalRatings = ratingStats.totalRatings || 0;
    } catch (error) {
      console.warn(`Could not fetch rating stats for rider ${rider.id}:`, error);
    }

    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    // Generate random color for avatar
    const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-secondary', 'bg-danger'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3">
          <div class="${randomColor} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
            <i class="bi bi-person-fill text-white"></i>
          </div>
        </div>
        <div>
          <h6 class="mb-1">${rider.name || rider.Name}</h6>
          <small class="text-muted">Student ID: ${rider.userId || rider.UserId || 'N/A'}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="text-center">
          <div class="fw-bold text-primary">${rider.totalRides || rider.TotalRides || 0}</div>
          <small class="text-muted">Rides</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-success">$${((rider.totalRides || 0) * 5).toFixed(2)}</div>
          <small class="text-muted">Total Spent</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-info">${rider.averageRating.toFixed(1)}</div>
          <small class="text-muted">Avg Rating Given</small>
        </div>
        <span class="badge ${getRiderStatusBadgeClass(rider.riderStatus)}">${rider.riderStatus}</span>
      </div>
    `;
    container.appendChild(item);
  }
}

function getRiderStatusBadgeClass(status) {
  switch(status) {
    case 'VIP': return 'bg-primary';
    case 'Regular': return 'bg-success';
    case 'New': return 'bg-warning';
    default: return 'bg-secondary';
  }
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
  // Start polling every 5 seconds
  dashboardPollingInterval = setInterval(() => {
    renderDashboard();
  }, 5000);
}

function stopDashboardPolling() {
  if (dashboardPollingInterval) {
    clearInterval(dashboardPollingInterval);
    dashboardPollingInterval = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if API service is available
  if (typeof apiService === 'undefined') {
    console.error('ApiService not available. Please ensure api-service.js is loaded.');
    return;
  }

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


