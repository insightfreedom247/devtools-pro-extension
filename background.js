// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('DevTools Pro installed successfully');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'debugger':
      handleDebugger(sendResponse);
      break;
    case 'screenshot':
      handleScreenshot(sendResponse);
      break;
    case 'network':
      handleNetwork(sendResponse);
      break;
    case 'memory':
      handleMemory(sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  return true;
});

// Tool handlers
function handleDebugger(sendResponse) {
  chrome.debugger.attach({ tabId: -1 }, '1.3', () => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError });
    } else {
      sendResponse({ success: true });
    }
  });
}

function handleScreenshot(sendResponse) {
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError });
    } else {
      chrome.downloads.download({
        url: dataUrl,
        filename: `screenshot-${Date.now()}.png`
      }, () => {
        sendResponse({ success: true });
      });
    }
  });
}

function handleNetwork(sendResponse) {
  chrome.webRequest.onBeforeRequest.addListener(
    details => {
      console.log('Network request:', details);
    },
    { urls: ['<all_urls>'] }
  );
  sendResponse({ success: true });
}

function handleMemory(sendResponse) {
  if (chrome.system && chrome.system.memory) {
    chrome.system.memory.getInfo(info => {
      sendResponse({ success: true, data: info });
    });
  } else {
    sendResponse({ success: false, error: 'Memory API not available' });
  }
}

// Error handling
chrome.runtime.onError.addListener(error => {
  console.error('Extension error:', error);
});