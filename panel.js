document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.panel;
      
      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(panelId).classList.add('active');
      
      // Refresh data for the active panel
      refreshPanel(panelId);
    });
  });

  // Initialize data
  refreshPanel('performance');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'performanceData':
        updatePerformancePanel(message.data);
        break;
      case 'networkAnalysis':
        updateNetworkPanel(message.data);
        break;
      case 'elementSelected':
        updateDebugPanel(message.data);
        break;
    }
  });
});

// Panel refresh handlers
function refreshPanel(panelId) {
  switch (panelId) {
    case 'performance':
      refreshPerformance();
      break;
    case 'network':
      refreshNetwork();
      break;
    case 'memory':
      refreshMemory();
      break;
    case 'debug':
      refreshDebug();
      break;
  }
}

function refreshPerformance() {
  chrome.runtime.sendMessage({ action: 'getPerformance' }, response => {
    if (response && response.success) {
      updatePerformancePanel(response.data);
    }
  });
}

function refreshNetwork() {
  chrome.runtime.sendMessage({ action: 'getNetwork' }, response => {
    if (response && response.success) {
      updateNetworkPanel(response.data);
    }
  });
}

function refreshMemory() {
  chrome.runtime.sendMessage({ action: 'getMemory' }, response => {
    if (response && response.success) {
      updateMemoryPanel(response.data);
    }
  });
}

function refreshDebug() {
  chrome.runtime.sendMessage({ action: 'getDebug' }, response => {
    if (response && response.success) {
      updateDebugPanel(response.data);
    }
  });
}

// Panel update handlers
function updatePerformancePanel(data) {
  document.getElementById('loadTime').textContent = `${data.loadTime}ms`;
  document.getElementById('domReady').textContent = `${data.domReady}ms`;
  document.getElementById('firstPaint').textContent = `${data.firstPaint}ms`;
  document.getElementById('resources').textContent = data.resources.length;
}

function updateNetworkPanel(data) {
  document.getElementById('totalRequests').textContent = data.requests;
  document.getElementById('totalSize').textContent = formatSize(data.size);
}

function updateMemoryPanel(data) {
  document.getElementById('memoryUsage').textContent = formatSize(data.usedMemory);
  document.getElementById('domNodes').textContent = data.domNodes;
}

function updateDebugPanel(data) {
  document.getElementById('breakpoints').textContent = data.breakpoints;
  document.getElementById('consoleLogs').textContent = data.logs;
}

// Utility functions
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}