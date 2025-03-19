document.addEventListener('DOMContentLoaded', function() {
  // Initialize tools
  const tools = ['debugger', 'screenshot', 'network', 'memory'];
  const statusBar = document.getElementById('status');

  // Add click handlers for each tool
  tools.forEach(toolId => {
    const toolCard = document.getElementById(toolId);
    toolCard.addEventListener('click', () => activateTool(toolId));
  });

  // Tool activation handler
  function activateTool(toolId) {
    statusBar.textContent = `Activating ${toolId}...`;
    
    chrome.runtime.sendMessage({ action: toolId }, response => {
      if (response && response.success) {
        statusBar.textContent = `${toolId} activated successfully`;
      } else {
        statusBar.textContent = `Error activating ${toolId}`;
      }
    });
  }

  // Initialize system monitoring
  function updateSystemStatus() {
    if (chrome.system && chrome.system.cpu && chrome.system.memory) {
      chrome.system.cpu.getInfo(cpuInfo => {
        chrome.system.memory.getInfo(memoryInfo => {
          const cpuUsage = calculateCPUUsage(cpuInfo);
          const memoryUsage = calculateMemoryUsage(memoryInfo);
          
          statusBar.textContent = `CPU: ${cpuUsage}% | Memory: ${memoryUsage}%`;
        });
      });
    }
  }

  // Helper functions for system monitoring
  function calculateCPUUsage(cpuInfo) {
    if (!cpuInfo || !cpuInfo.processors) return 'N/A';
    
    const usage = cpuInfo.processors.reduce((acc, processor) => {
      return acc + processor.usage.user;
    }, 0) / cpuInfo.processors.length;

    return Math.round(usage);
  }

  function calculateMemoryUsage(memoryInfo) {
    if (!memoryInfo) return 'N/A';
    
    const used = memoryInfo.capacity - memoryInfo.availableCapacity;
    return Math.round((used / memoryInfo.capacity) * 100);
  }

  // Update system status every 5 seconds
  setInterval(updateSystemStatus, 5000);
});