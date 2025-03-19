document.addEventListener('DOMContentLoaded', function() {
  const status = document.getElementById('status');

  document.getElementById('capture').addEventListener('click', function() {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'screenshot.png';
      link.click();
      status.textContent = 'Đã chụp màn hình!';
    });
  });

  document.getElementById('inspect').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: inspectElement
      });
      status.textContent = 'Đang kiểm tra element...';
    });
  });

  document.getElementById('clear').addEventListener('click', function() {
    console.clear();
    status.textContent = 'Đã xóa logs!';
  });
});

function inspectElement() {
  document.body.style.cursor = 'crosshair';
  
  function onClick(e) {
    e.preventDefault();
    console.log('Selected element:', e.target);
    document.body.style.cursor = 'default';
    document.removeEventListener('click', onClick);
  }

  document.addEventListener('click', onClick);
}