document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị URL hiện tại
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        document.getElementById('currentUrl').textContent = tabs[0].url;
    });

    // Xử lý chuyển tab
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Xóa active class từ tất cả tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Thêm active class vào tab được click
            this.classList.add('active');

            // Ẩn tất cả panels
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            // Hiển thị panel tương ứng
            const panelId = this.getAttribute('data-panel');
            document.getElementById(panelId).classList.add('active');
        });
    });

    // Chụp màn hình
    document.getElementById('captureScreenshot').addEventListener('click', function() {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
            const link = document.createElement('a');
            link.download = 'screenshot.png';
            link.href = dataUrl;
            link.click();
        });
    });

    // Kiểm tra phần tử
    document.getElementById('inspectElement').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.debugger.attach({tabId: tabs[0].id}, '1.3', function() {
                chrome.debugger.sendCommand({tabId: tabs[0].id}, 'DOM.enable');
                chrome.debugger.sendCommand({tabId: tabs[0].id}, 'Overlay.enable');
                chrome.debugger.sendCommand({tabId: tabs[0].id}, 'Overlay.setInspectMode', {
                    mode: 'searchForNode',
                    highlightConfig: {
                        showInfo: true,
                        showRulers: true,
                        showExtensionLines: true,
                        contentColor: {r: 111, g: 168, b: 220, a: 0.66},
                        paddingColor: {r: 147, g: 196, b: 125, a: 0.66},
                        borderColor: {r: 255, g: 229, b: 153, a: 0.66},
                        marginColor: {r: 246, g: 178, b: 107, a: 0.66}
                    }
                });
            });
        });
    });

    // Xóa console
    document.getElementById('clearConsole').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'clearConsole'});
        document.getElementById('consoleLogs').innerHTML = '';
    });

    // Bắt đầu profiling
    document.getElementById('startProfiling').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'startProfiling'});
        this.disabled = true;
        document.getElementById('stopProfiling').disabled = false;
    });

    // Dừng profiling
    document.getElementById('stopProfiling').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'stopProfiling'});
        this.disabled = true;
        document.getElementById('startProfiling').disabled = false;
    });

    // Xóa network log
    document.getElementById('clearNetwork').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'clearNetwork'});
        document.getElementById('networkRequests').innerHTML = '';
    });

    // Tải HAR file
    document.getElementById('downloadHAR').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'getHAR'}, function(response) {
            const blob = new Blob([JSON.stringify(response, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'network.har';
            link.click();
            URL.revokeObjectURL(url);
        });
    });

    // Lắng nghe và hiển thị console logs
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === 'consoleLog') {
            const logDiv = document.createElement('div');
            logDiv.className = 'log-entry' + (message.level === 'error' ? ' log-error' : '');
            logDiv.textContent = message.content;
            document.getElementById('consoleLogs').appendChild(logDiv);
        } else if (message.type === 'networkRequest') {
            const requestDiv = document.createElement('div');
            requestDiv.className = 'network-item';
            requestDiv.innerHTML = `
                <span class="network-url">${message.url}</span>
                <span class="network-time">${message.time}ms</span>
            `;
            document.getElementById('networkRequests').appendChild(requestDiv);
        } else if (message.type === 'performanceMetrics') {
            document.getElementById('cpuUsage').textContent = message.cpu + '%';
            document.getElementById('memoryUsage').textContent = Math.round(message.memory / 1024 / 1024) + 'MB';
        }
    });

    // Khởi tạo metrics
    chrome.runtime.sendMessage({action: 'getPerformanceMetrics'});
    
    // Cập nhật metrics mỗi giây
    setInterval(() => {
        chrome.runtime.sendMessage({action: 'getPerformanceMetrics'});
    }, 1000);
});