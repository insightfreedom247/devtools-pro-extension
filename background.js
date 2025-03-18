// Lưu trữ logs và metrics
let consoleLogs = [];
let networkRequests = [];
let isProfilingActive = false;
let profilingData = null;

// Khởi tạo debugger cho tab
function initializeDebugger(tabId) {
    chrome.debugger.attach({tabId: tabId}, '1.3', function() {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        
        // Bật các domain cần thiết
        chrome.debugger.sendCommand({tabId: tabId}, 'Network.enable');
        chrome.debugger.sendCommand({tabId: tabId}, 'Performance.enable');
        chrome.debugger.sendCommand({tabId: tabId}, 'Console.enable');
    });
}

// Lắng nghe các sự kiện debugger
chrome.debugger.onEvent.addListener((debuggeeId, message, params) => {
    if (message === 'Network.responseReceived') {
        const request = {
            url: params.response.url,
            status: params.response.status,
            type: params.type,
            time: Date.now()
        };
        networkRequests.push(request);
        
        // Gửi thông tin request tới popup
        chrome.runtime.sendMessage({
            type: 'networkRequest',
            ...request
        });
    }
    else if (message === 'Console.messageAdded') {
        const log = {
            content: params.message.text,
            level: params.message.level,
            timestamp: Date.now()
        };
        consoleLogs.push(log);
        
        // Gửi log tới popup
        chrome.runtime.sendMessage({
            type: 'consoleLog',
            ...log
        });
    }
});

// Xử lý messages từ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'clearConsole') {
        consoleLogs = [];
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.debugger.sendCommand({tabId: tabs[0].id}, 'Console.clear');
        });
    }
    else if (message.action === 'clearNetwork') {
        networkRequests = [];
    }
    else if (message.action === 'getHAR') {
        const har = {
            log: {
                version: '1.2',
                creator: {
                    name: 'DevTools Pro',
                    version: '1.0'
                },
                entries: networkRequests.map(req => ({
                    startedDateTime: new Date(req.time).toISOString(),
                    request: {
                        method: 'GET',
                        url: req.url
                    },
                    response: {
                        status: req.status
                    },
                    time: 0
                }))
            }
        };
        sendResponse(har);
    }
    else if (message.action === 'startProfiling') {
        isProfilingActive = true;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.debugger.sendCommand(
                {tabId: tabs[0].id},
                'Performance.startRecording'
            );
        });
    }
    else if (message.action === 'stopProfiling') {
        isProfilingActive = false;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.debugger.sendCommand(
                {tabId: tabs[0].id},
                'Performance.stopRecording',
                function(response) {
                    profilingData = response;
                }
            );
        });
    }
    else if (message.action === 'getPerformanceMetrics') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.debugger.sendCommand(
                {tabId: tabs[0].id},
                'Performance.getMetrics',
                function(metrics) {
                    if (metrics) {
                        const cpuTime = metrics.metrics.find(m => m.name === 'CPUTime');
                        const jsHeapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
                        
                        chrome.runtime.sendMessage({
                            type: 'performanceMetrics',
                            cpu: cpuTime ? Math.round(cpuTime.value * 100) : 0,
                            memory: jsHeapSize ? jsHeapSize.value : 0
                        });
                    }
                }
            );
        });
    }
});

// Khởi tạo debugger khi tab được tạo
chrome.tabs.onCreated.addListener(function(tab) {
    initializeDebugger(tab.id);
});

// Khởi tạo debugger cho tab hiện tại khi extension được load
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
        initializeDebugger(tabs[0].id);
    }
});