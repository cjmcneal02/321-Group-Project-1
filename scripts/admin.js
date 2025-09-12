// Driver data matching the HTML structure
const driverData = [
  { 
    name: 'John Driver', 
    cartId: 'SC-001', 
    rating: 4.9, 
    avgTip: 45.20, 
    rides: 23, 
    status: 'Active',
    avatarColor: 'bg-primary'
  },
  { 
    name: 'Sarah Wilson', 
    cartId: 'SC-002', 
    rating: 4.8, 
    avgTip: 38.50, 
    rides: 18, 
    status: 'Active',
    avatarColor: 'bg-success'
  },
  { 
    name: 'Mike Chen', 
    cartId: 'SC-003', 
    rating: 4.7, 
    avgTip: 42.10, 
    rides: 15, 
    status: 'Break',
    avatarColor: 'bg-warning'
  },
  { 
    name: 'Emily Rodriguez', 
    cartId: 'SC-004', 
    rating: 4.9, 
    avgTip: 41.80, 
    rides: 21, 
    status: 'Active',
    avatarColor: 'bg-info'
  },
  { 
    name: 'David Kim', 
    cartId: 'SC-005', 
    rating: 4.6, 
    avgTip: 35.90, 
    rides: 12, 
    status: 'Offline',
    avatarColor: 'bg-secondary'
  }
];

function formatCurrency(amount) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'Active': return 'bg-success';
    case 'Break': return 'bg-warning';
    case 'Offline': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function renderDriverList(sortBy = 'rating') {
  const list = document.getElementById('driver-list');
  list.innerHTML = '';

  // Sort the drivers based on the selected criteria
  const sortedDrivers = [...driverData].sort((a, b) => {
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
          <div class="${driver.avatarColor} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
            <i class="bi bi-person-fill text-white"></i>
          </div>
        </div>
        <div>
          <h6 class="mb-1">${driver.name}</h6>
          <small class="text-muted">Solar Cart #${driver.cartId}</small>
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
          <div class="fw-bold text-info">${driver.rides}</div>
          <small class="text-muted">Rides</small>
        </div>
        <span class="badge ${getStatusBadgeClass(driver.status)}">${driver.status}</span>
      </div>
    `;
    list.appendChild(item);
  });
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
      renderDriverList(sortSelect.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the driver list with default sorting (highest rating)
  renderDriverList('rating');
  
  // Initialize event listeners
  initEvents();
});


