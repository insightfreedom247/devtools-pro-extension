// Lưu trữ console logs gốc
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

// Override console methods
console.log = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: message,
        level: 'info',
        timestamp: Date.now()
    });
    
    originalConsole.log.apply(console, args);
};

console.error = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: message,
        level: 'error',
        timestamp: Date.now()
    });
    
    originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: message,
        level: 'warning',
        timestamp: Date.now()
    });
    
    originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: message,
        level: 'info',
        timestamp: Date.now()
    });
    
    originalConsole.info.apply(console, args);
};

// Theo dõi performance
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
            chrome.runtime.sendMessage({
                type: 'networkRequest',
                url: entry.name,
                time: entry.duration,
                timestamp: Date.now()
            });
        }
    }
});

observer.observe({
    entryTypes: ['resource', 'navigation', 'paint']
});

// Theo dõi errors
window.addEventListener('error', function(event) {
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: `Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
        level: 'error',
        timestamp: Date.now()
    });
});

// Theo dõi unhandled rejections
window.addEventListener('unhandledrejection', function(event) {
    chrome.runtime.sendMessage({
        type: 'consoleLog',
        content: `Unhandled Promise Rejection: ${event.reason}`,
        level: 'error',
        timestamp: Date.now()
    });
});

// Theo dõi DOM mutations
const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            chrome.runtime.sendMessage({
                type: 'consoleLog',
                content: `DOM Changed: ${mutation.target.nodeName} had ${mutation.addedNodes.length} nodes added and ${mutation.removedNodes.length} removed`,
                level: 'info',
                timestamp: Date.now()
            });
        }
    });
});

mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Lắng nghe messages từ popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectElement') {
        // Bật chế độ inspect
        document.body.style.cursor = 'crosshair';
        
        const clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.target;
            const elementInfo = {
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                textContent: element.textContent.substring(0, 100),
                attributes: Array.from(element.attributes).map(attr => ({
                    name: attr.name,
                    value: attr.value
                }))
            };
            
            chrome.runtime.sendMessage({
                type: 'elementInspected',
                element: elementInfo
            });
            
            document.body.style.cursor = 'default';
            document.removeEventListener('click', clickHandler, true);
        };
        
        document.addEventListener('click', clickHandler, true);
    }
});