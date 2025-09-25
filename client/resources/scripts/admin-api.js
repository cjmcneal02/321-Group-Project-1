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

function renderDriverList(drivers, sortBy = 'rating') {
  const list = document.getElementById('driver-list');
  if (!list) return;
  
  list.innerHTML = '';

  // Sort the drivers based on the selected criteria
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (sortBy === 'avgTip') {
      return b.AverageTip - a.AverageTip; // Highest tip first
    }
    return b.Rating - a.Rating; // Highest rating first
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
          <h6 class="mb-1">${driver.Name}</h6>
          <small class="text-muted">Solar Cart #${driver.VehicleId}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="text-center">
          <div class="fw-bold text-primary">${driver.Rating.toFixed(1)}</div>
          <small class="text-muted">Rating</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-success">$${driver.AverageTip.toFixed(2)}</div>
          <small class="text-muted">Avg Tip</small>
        </div>
        <div class="text-center">
          <div class="fw-bold text-info">${driver.TotalRides}</div>
          <small class="text-muted">Rides</small>
        </div>
        <span class="badge ${getStatusBadgeClass(driver.Status)}">${driver.Status}</span>
      </div>
    `;
    list.appendChild(item);
  });
}

async function renderDashboard() {
  if (typeof apiService === 'undefined') {
    console.warn('ApiService not available');
    return;
  }

  try {
    // Get live data from API
    const drivers = await apiService.getDrivers();
    const activeRide = await apiService.getActiveRide();
    const rideRequests = await apiService.getRideRequests();

    // Update driver list with live data
    const driversWithStatus = drivers.map(driver => ({
      ...driver,
      Status: driver.IsAvailable ? 'Active' : 'On Ride'
    }));

    // Get current sort selection
    const sortSelect = document.getElementById('driver-sort');
    const currentSort = sortSelect ? sortSelect.value : 'rating';
    
    renderDriverList(driversWithStatus, currentSort);

    // Update monthly summary banner
    await updateMonthlySummary(driversWithStatus, activeRide, rideRequests);

  } catch (error) {
    console.error('Error rendering dashboard:', error);
    showNotification('Failed to load dashboard data', 'danger');
  }
}

async function updateMonthlySummary(drivers, activeRide, rideRequests) {
  const summaryBanner = document.getElementById('summary-banner');
  if (!summaryBanner) return;

  const activeDrivers = drivers.filter(driver => driver.Status === 'Active').length;
  const onRideDrivers = drivers.filter(driver => driver.Status === 'On Ride').length;
  const pendingRequests = rideRequests.length;

  // Get ride history for total rides and revenue
  let totalRidesCompleted = 0;
  let totalRevenue = 0;

  try {
    const rideHistory = await apiService.getRideHistory();
    totalRidesCompleted = rideHistory.length;
    totalRevenue = rideHistory.reduce((sum, ride) => sum + ride.EstimatedFare, 0);
  } catch (error) {
    console.error('Error loading ride history:', error);
  }

  const currentTime = new Date();
  const monthName = currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  summaryBanner.innerHTML = `
    <div class="row text-center">
      <div class="col-md-2">
        <div class="h4 text-primary mb-0">${activeDrivers}</div>
        <small class="text-muted">Active Drivers</small>
      </div>
      <div class="col-md-2">
        <div class="h4 text-warning mb-0">${onRideDrivers}</div>
        <small class="text-muted">On Ride</small>
      </div>
      <div class="col-md-2">
        <div class="h4 text-info mb-0">${pendingRequests}</div>
        <small class="text-muted">Pending Requests</small>
      </div>
      <div class="col-md-2">
        <div class="h4 text-success mb-0">${totalRidesCompleted}</div>
        <small class="text-muted">Total Rides Completed</small>
      </div>
      <div class="col-md-2">
        <div class="h4 text-success mb-0">${formatCurrency(totalRevenue)}</div>
        <small class="text-muted">Total Revenue</small>
      </div>
      <div class="col-md-2">
        <div class="h4 text-secondary mb-0">${monthName}</div>
        <small class="text-muted">Current Month</small>
      </div>
    </div>
  `;
}

function startDashboardPolling() {
  // Initial render
  renderDashboard();
  
  // Set up polling every 5 seconds
  dashboardPollingInterval = setInterval(renderDashboard, 5000);
}

function stopDashboardPolling() {
  if (dashboardPollingInterval) {
    clearInterval(dashboardPollingInterval);
    dashboardPollingInterval = null;
  }
}

function showNotification(message, type = 'info') {
  const alertClass = {
    'success': 'alert-success',
    'danger': 'alert-danger',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';

  const notificationHtml = `
    <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
         style="top: 20px; right: 20px; z-index: 10000; min-width: 300px;" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', notificationHtml);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.querySelector('.alert');
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Ensure API service is loaded first
  if (typeof apiService === 'undefined') {
    console.error('ApiService not loaded! Check script loading order.');
    alert('ApiService not loaded! Please refresh the page.');
    return;
  }

  // Set up sort change handler
  const sortSelect = document.getElementById('driver-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderDashboard();
    });
  }

  // Start dashboard polling
  startDashboardPolling();

  // Stop polling when page is unloaded
  window.addEventListener('beforeunload', stopDashboardPolling);
});
