// Initialize content script
console.log('DevTools Pro content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyze':
      analyzePerformance();
      break;
    case 'inspect':
      inspectElement();
      break;
  }
  return true;
});

// Performance analysis
function analyzePerformance() {
  const timing = window.performance.timing;
  const performance = {
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 'N/A',
    resources: performance.getEntriesByType('resource')
  };

  chrome.runtime.sendMessage({
    action: 'performanceData',
    data: performance
  });
}

// Element inspection
function inspectElement() {
  document.addEventListener('mouseover', highlightElement);
  document.addEventListener('click', selectElement);
}

function highlightElement(e) {
  e.preventDefault();
  const element = e.target;
  
  // Remove existing highlights
  const existing = document.querySelector('.devtools-pro-highlight');
  if (existing) existing.remove();

  // Create highlight overlay
  const highlight = document.createElement('div');
  highlight.className = 'devtools-pro-highlight';
  const rect = element.getBoundingClientRect();
  
  Object.assign(highlight.style, {
    position: 'fixed',
    border: '2px solid #1a73e8',
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    pointerEvents: 'none',
    zIndex: 10000,
    top: rect.top + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  });

  document.body.appendChild(highlight);
}

function selectElement(e) {
  e.preventDefault();
  const element = e.target;
  
  // Get element details
  const details = {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    classes: Array.from(element.classList),
    attributes: Array.from(element.attributes).map(attr => ({
      name: attr.name,
      value: attr.value
    })),
    styles: window.getComputedStyle(element)
  };

  chrome.runtime.sendMessage({
    action: 'elementSelected',
    data: details
  });

  // Clean up
  document.removeEventListener('mouseover', highlightElement);
  document.removeEventListener('click', selectElement);
  const highlight = document.querySelector('.devtools-pro-highlight');
  if (highlight) highlight.remove();
}