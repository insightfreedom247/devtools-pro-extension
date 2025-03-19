// Create DevTools panel
chrome.devtools.panels.create(
  'DevTools Pro',
  'icons/icon16.png',
  'panel.html',
  panel => {
    panel.onShown.addListener(window => {
      console.log('Panel shown');
    });
    
    panel.onHidden.addListener(() => {
      console.log('Panel hidden');
    });
  }
);

// Create network panel
chrome.devtools.network.onRequestFinished.addListener(request => {
  analyzeRequest(request);
});

function analyzeRequest(request) {
  const analysis = {
    url: request.request.url,
    method: request.request.method,
    status: request.response.status,
    timing: request.time,
    size: request.response.bodySize,
    type: request.type
  };

  chrome.runtime.sendMessage({
    action: 'networkAnalysis',
    data: analysis
  });
}