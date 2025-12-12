// client/js/utils.js
// Stock status helper functions
window.getStockStatus = function(quantity, minQuantity = 5) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minQuantity) return 'low_stock';
  return 'in_stock';
};

window.getStockStatusClass = function(quantity, minQuantity = 5) {
  const status = window.getStockStatus(quantity, minQuantity);
  switch (status) {
    case 'out_of_stock': return 'danger';
    case 'low_stock': return 'warning';
    case 'in_stock': return 'success';
    default: return 'secondary';
  }
};

window.getStockStatusText = function(quantity, minQuantity = 5) {
  const status = window.getStockStatus(quantity, minQuantity);
  switch (status) {
    case 'out_of_stock': return 'Out of Stock';
    case 'low_stock': return 'Low Stock';
    case 'in_stock': return 'In Stock';
    default: return 'Unknown';
  }
};

window.formatCurrency = function(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

window.createInventoryChart = function(stats) {
  const ctx = document.getElementById('inventoryChart');
  if (!ctx || typeof Chart === 'undefined') return null;
  
  return new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Total Items', 'Low Stock', 'Out of Stock', 'Total Value'],
      datasets: [{
        label: 'Inventory Overview',
        data: [
          stats.total_items || 0,
          stats.low_stock || 0,
          stats.out_of_stock || 0,
          stats.total_value ? parseFloat(stats.total_value) / 100 : 0
        ],
        backgroundColor: [
          'rgba(67, 97, 238, 0.7)',
          'rgba(255, 159, 28, 0.7)',
          'rgba(231, 29, 54, 0.7)',
          'rgba(46, 196, 182, 0.7)'
        ],
        borderColor: [
          'rgba(67, 97, 238, 1)',
          'rgba(255, 159, 28, 1)',
          'rgba(231, 29, 54, 1)',
          'rgba(46, 196, 182, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};