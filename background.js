// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('DevTools Pro installed successfully');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
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
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep the message channel open for async response
});

// Tool handlers
async function handleDebugger(sendResponse) {
  try {
    if (chrome.debugger) {
      await chrome.debugger.attach({ tabId: -1 }, '1.3');
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Debugger API not available' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleScreenshot(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    await chrome.downloads.download({
      url: dataUrl,
      filename: `screenshot-${Date.now()}.png`
    });
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleNetwork(sendResponse) {
  try {
    if (!chrome.webRequest) {
      sendResponse({ success: false, error: 'WebRequest API not available' });
      return;
    }

    chrome.webRequest.onBeforeRequest.addListener(
      details => {
        console.log('Network request:', details);
      },
      { urls: ['<all_urls>'] }
    );
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleMemory(sendResponse) {
  try {
    if (!chrome.system || !chrome.system.memory) {
      sendResponse({ success: false, error: 'Memory API not available' });
      return;
    }

    const info = await chrome.system.memory.getInfo();
    sendResponse({ success: true, data: info });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Error handling
chrome.runtime.onError.addListener(error => {
  console.error('Extension error:', error);
});