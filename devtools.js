// Tạo panel mới trong DevTools
chrome.devtools.panels.create(
    "DevTools Pro",
    "icons/icon16.png",
    "panel.html",
    function(panel) {
        console.log("Panel created");
    }
);

// Tạo side panel trong Elements panel
chrome.devtools.panels.elements.createSidebarPane(
    "DevTools Pro",
    function(sidebar) {
        sidebar.setPage("sidebar.html");
    }
);

// Lắng nghe network requests
chrome.devtools.network.onRequestFinished.addListener(
    function(request) {
        // Gửi thông tin request tới background script
        chrome.runtime.sendMessage({
            type: 'networkRequest',
            url: request.request.url,
            method: request.request.method,
            status: request.response.status,
            time: request.time,
            size: request.response.bodySize
        });
    }
);

// Theo dõi console logs
chrome.devtools.console.onMessageAdded.addListener(
    function(message) {
        chrome.runtime.sendMessage({
            type: 'consoleLog',
            content: message.text,
            level: message.level,
            timestamp: Date.now()
        });
    }
);

// Theo dõi performance
let performanceBuffer = [];
chrome.devtools.timeline.onEventRecorded.addListener(
    function(event) {
        performanceBuffer.push(event);
        if (performanceBuffer.length > 1000) {
            chrome.runtime.sendMessage({
                type: 'performanceData',
                data: performanceBuffer
            });
            performanceBuffer = [];
        }
    }
);