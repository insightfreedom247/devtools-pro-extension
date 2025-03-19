// Khởi tạo biến
let consoleBuffer = [];
let networkBuffer = [];
let performanceData = [];

// Xử lý tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Xóa active class từ tất cả tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Thêm active class vào tab được click
        this.classList.add('active');

        // Ẩn tất cả tab content
        document.querySelectorAll('#consoleTab, #networkTab, #performanceTab').forEach(content => {
            content.style.display = 'none';
        });

        // Hiển thị tab content tương ứng
        const tabId = this.getAttribute('data-tab') + 'Tab';
        document.getElementById(tabId).style.display = 'block';
    });
});

// Xử lý tool items
document.getElementById('inspectElement').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'inspectElement'});
});

document.getElementById('screenshot').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'takeScreenshot'});
});

document.getElementById('colorPicker').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'enableColorPicker'});
});

// Xử lý buttons
document.getElementById('clearLogs').addEventListener('click', function() {
    consoleBuffer = [];
    networkBuffer = [];
    document.getElementById('consoleTab').innerHTML = '';
    document.getElementById('networkTab').innerHTML = '';
    chrome.runtime.sendMessage({action: 'clearLogs'});
});

document.getElementById('downloadLogs').addEventListener('click', function() {
    const logs = {
        console: consoleBuffer,
        network: networkBuffer,
        performance: performanceData
    };
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devtools-pro-logs.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('copyLogs').addEventListener('click', function() {
    const logs = {
        console: consoleBuffer,
        network: networkBuffer,
        performance: performanceData
    };
    
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2))
        .then(() => {
            // Hiển thị thông báo thành công
            const notification = document.createElement('div');
            notification.textContent = 'Đã sao chép logs vào clipboard';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.background = '#4caf50';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '4px';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        });
});

// Lắng nghe messages từ background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'consoleLog') {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry log-' + message.level;
        logEntry.textContent = `[${new Date(message.timestamp).toLocaleTimeString()}] ${message.content}`;
        document.getElementById('consoleTab').appendChild(logEntry);
        consoleBuffer.push(message);
        
        // Cập nhật số lượng logs
        updateMetrics();
    }
    else if (message.type === 'networkRequest') {
        const requestEntry = document.createElement('div');
        requestEntry.className = 'log-entry';
        requestEntry.textContent = `[${new Date(message.timestamp).toLocaleTimeString()}] ${message.method} ${message.url} (${message.status}) - ${message.time}ms`;
        document.getElementById('networkTab').appendChild(requestEntry);
        networkBuffer.push(message);
        
        // Cập nhật số lượng requests
        updateMetrics();
    }
    else if (message.type === 'performanceData') {
        performanceData = performanceData.concat(message.data);
        updatePerformanceTab();
    }
    else if (message.type === 'metrics') {
        updateMetrics(message.metrics);
    }
});

// Cập nhật metrics
function updateMetrics(metrics = null) {
    if (metrics) {
        document.getElementById('cpuUsage').textContent = metrics.cpu + '%';
        document.getElementById('memoryUsage').textContent = Math.round(metrics.memory / 1024 / 1024) + ' MB';
        document.getElementById('requestCount').textContent = metrics.requests;
        document.getElementById('domCount').textContent = metrics.domElements;
    } else {
        document.getElementById('requestCount').textContent = networkBuffer.length;
    }
}

// Cập nhật performance tab
function updatePerformanceTab() {
    const performanceTab = document.getElementById('performanceTab');
    performanceTab.innerHTML = '';
    
    // Tạo biểu đồ hiệu suất
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    performanceTab.appendChild(canvas);
    
    // Vẽ biểu đồ (sử dụng Chart.js hoặc thư viện khác)
    // Code vẽ biểu đồ sẽ được thêm sau
}

// Khởi tạo metrics
chrome.runtime.sendMessage({action: 'getMetrics'});