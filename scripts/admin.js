// Mock data for current month
const mockData = {
  summary: {
    rides: 342,
    revenue: 5123.75
  },
  drivers: [
    { id: 'd1', name: 'Alex Carter', rating: 4.95, rides: 112, tips: [5, 8, 4, 12, 3] },
    { id: 'd2', name: 'Bailey Nguyen', rating: 4.87, rides: 98, tips: [2, 4, 1, 0, 3, 7] },
    { id: 'd3', name: 'Chris Patel', rating: 4.99, rides: 124, tips: [10, 20, 15, 12] },
    { id: 'd4', name: 'Dana Smith', rating: 4.72, rides: 85, tips: [0, 1, 0, 2] },
    { id: 'd5', name: 'Evan Johnson', rating: 4.80, rides: 90, tips: [3, 1, 5, 2, 4] }
  ],
  riders: [
    { id: 'r1', name: 'Jordan Lee', rides: 22 },
    { id: 'r2', name: 'Taylor Kim', rides: 18 },
    { id: 'r3', name: 'Morgan Diaz', rides: 31 },
    { id: 'r4', name: 'Riley Chen', rides: 12 },
    { id: 'r5', name: 'Casey Brown', rides: 27 }
  ]
};

function formatCurrency(amount) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function calculateAverageTip(tips) {
  if (!tips || tips.length === 0) return 0;
  const total = tips.reduce((sum, t) => sum + t, 0);
  return total / tips.length;
}

function renderSummary() {
  const ridesEl = document.getElementById('summary-rides');
  const revenueEl = document.getElementById('summary-revenue');
  ridesEl.textContent = String(mockData.summary.rides);
  revenueEl.textContent = mockData.summary.revenue.toFixed(2);
}

function renderDriverList(sortBy = 'rating') {
  const list = document.getElementById('driver-list');
  list.innerHTML = '';

  const items = mockData.drivers.map(d => ({
    ...d,
    avgTip: calculateAverageTip(d.tips)
  }));

  items.sort((a, b) => {
    if (sortBy === 'avgTip') return b.avgTip - a.avgTip;
    return b.rating - a.rating;
  });

  items.forEach((d, index) => {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `
      <div>
        <div class="fw-semibold">${index + 1}. ${d.name}</div>
        <div class="text-muted small">Rides: ${d.rides} • Rating: ${d.rating.toFixed(2)} • Avg tip: ${formatCurrency(d.avgTip)}</div>
      </div>
      <span class="stat-pill">${sortBy === 'avgTip' ? formatCurrency(d.avgTip) + ' avg' : d.rating.toFixed(2) + ' ★'}</span>
    `;
    list.appendChild(item);
  });
}

function renderRiderList() {
  const list = document.getElementById('rider-list');
  list.innerHTML = '';

  const items = [...mockData.riders].sort((a, b) => b.rides - a.rides);
  items.forEach((r, index) => {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `
      <div>
        <div class="fw-semibold">${index + 1}. ${r.name}</div>
        <div class="text-muted small">Rides this month: ${r.rides}</div>
      </div>
      <span class="stat-pill">${r.rides} rides</span>
    `;
    list.appendChild(item);
  });
}

function showSection(section) {
  const driverSection = document.getElementById('driver-section');
  const riderSection = document.getElementById('rider-section');

  if (section === 'drivers') {
    driverSection.classList.remove('d-none');
    riderSection.classList.add('d-none');
  } else if (section === 'riders') {
    riderSection.classList.remove('d-none');
    driverSection.classList.add('d-none');
  }
}

function initEvents() {
  const btnDriver = document.getElementById('btn-driver-stats');
  const btnRider = document.getElementById('btn-rider-stats');
  const sortSelect = document.getElementById('driver-sort');

  btnDriver.addEventListener('click', () => {
    showSection('drivers');
    renderDriverList(sortSelect.value);
    btnDriver.classList.replace('btn-outline-primary', 'btn-primary');
    btnRider.classList.replace('btn-primary', 'btn-outline-primary');
  });

  btnRider.addEventListener('click', () => {
    showSection('riders');
    renderRiderList();
    btnRider.classList.replace('btn-outline-primary', 'btn-primary');
    btnDriver.classList.replace('btn-primary', 'btn-outline-primary');
  });

  sortSelect.addEventListener('change', () => {
    renderDriverList(sortSelect.value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  // Default view
  showSection('drivers');
  renderDriverList('rating');
  initEvents();
});


