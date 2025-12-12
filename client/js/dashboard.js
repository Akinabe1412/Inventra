// client/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard JS loaded');
  
  // Check if we're on dashboard page
  if (document.getElementById('dashboard-content')) {
    console.log('Loading dashboard data...');
    loadDashboardData();
  }
});

async function loadDashboardData() {
  try {
    console.log('Fetching dashboard data...');
    
    // Show loading
    document.getElementById('dashboard-loading')?.style.display = 'block';
    document.getElementById('dashboard-error')?.style.display = 'none';
    document.getElementById('dashboard-content')?.style.display = 'none';
    
    // Fetch data
    const response = await fetch('/api/dashboard/summary');
    const result = await response.json();
    
    console.log('Dashboard response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load dashboard');
    }
    
    // Update UI
    updateDashboard(result.data);
    
    // Hide loading, show content
    document.getElementById('dashboard-loading')?.style.display = 'none';
    document.getElementById('dashboard-content')?.style.display = 'block';
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    
    // Show error
    document.getElementById('dashboard-loading')?.style.display = 'none';
    document.getElementById('dashboard-error')?.style.display = 'block';
    document.getElementById('dashboard-error-message')?.textContent = 
      error.message || 'Failed to load dashboard data';
  }
}

function updateDashboard(data) {
  console.log('Updating dashboard with:', data);
  
  // Update summary cards
  updateElement('total-items', data.total_items || 0);
  updateElement('low-stock', data.low_stock || 0);
  updateElement('out-of-stock', data.out_of_stock || 0);
  updateElement('total-value', formatCurrency(data.total_value || 0, 'PHP'));
  updateElement('avg-price', formatCurrency(data.avg_price || 0));
  
  // Update recent items table if exists
  if (data.recent_items && data.recent_items.length > 0) {
    updateRecentItems(data.recent_items);
  }
}

function updateElement(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function updateRecentItems(items) {
  const tbody = document.getElementById('recent-items-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category_name || 'Uncategorized')}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price || 0)}</td>
      <td><span class="badge ${getStockStatusClass(item)}">${getStockStatusText(item)}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewItem(${item.id})">
          View
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getStockStatusClass(item) {
  if (item.quantity === 0) return 'bg-danger';
  if (item.quantity <= (item.min_quantity || 5)) return 'bg-warning';
  return 'bg-success';
}

function getStockStatusText(item) {
  if (item.quantity === 0) return 'Out of Stock';
  if (item.quantity <= (item.min_quantity || 5)) return 'Low Stock';
  return 'In Stock';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;
window.getStockStatusClass = getStockStatusClass;
window.getStockStatusText = getStockStatusText;