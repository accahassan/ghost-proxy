const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

// We store the entire HTML, CSS, and Vanilla JS inside this string to serve it from the backend.
// Note: String concatenation is used instead of template literals in the frontend JS to avoid Node.js escaping conflicts.
const frontendHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GhostProxy - Web Proxy Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body class="flex flex-col h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">

    <header class="bg-indigo-900 text-white p-4 shadow-md z-20 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <div class="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" id="logo-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <h1 class="text-xl font-bold tracking-wide">GhostProxy</h1>
            </div>
        </div>

        <form id="url-form" class="flex-1 w-full max-w-3xl flex items-center bg-indigo-950/50 rounded-full border border-indigo-700/50 focus-within:border-indigo-400 transition-colors overflow-hidden pl-4 pr-1 py-1 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-300">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input type="text" id="url-input" placeholder="Enter URL to surf anonymously (e.g., example.com)" class="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 w-full placeholder-indigo-300" autocomplete="off" />
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-medium transition-colors">Go</button>
        </form>

        <div class="relative w-full md:w-auto" id="dropdown-container">
            <button type="button" id="dropdown-btn" class="flex items-center justify-between gap-2 w-full md:w-48 bg-indigo-800 hover:bg-indigo-700 px-4 py-2.5 rounded-lg border border-indigo-700 transition-colors">
                <div class="flex items-center gap-2 truncate" id="selected-server-display">
                    <span id="selected-icon">🇺🇸</span>
                    <span id="selected-name" class="truncate text-sm font-medium">New York, USA</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div id="dropdown-menu" class="hidden absolute right-0 mt-2 w-full md:w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto custom-scrollbar"></div>
        </div>
    </header>

    <main class="flex-1 relative bg-gray-100 overflow-hidden flex flex-col w-full h-full">
        <div id="landing-view" class="flex-1 flex flex-col items-center justify-center p-6 text-center absolute inset-0 z-10 bg-gray-100 transition-opacity duration-300">
            <div class="bg-white p-8 rounded-2xl shadow-sm max-w-lg w-full border border-gray-200">
                <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Ready to browse freely?</h2>
                <p class="text-gray-500 mb-8">Enter a website URL above to route your traffic securely through our node backend.</p>
                
                <div class="grid grid-cols-2 gap-4 text-left">
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 class="font-semibold text-gray-800 flex items-center gap-2 text-sm mb-1"><span class="text-green-500">●</span> Direct Routing</h3>
                        <p class="text-xs text-gray-500">Bypasses iframe security blocks directly.</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 class="font-semibold text-gray-800 flex items-center gap-2 text-sm mb-1"><span class="text-blue-500">●</span> Header Stripping</h3>
                        <p class="text-xs text-gray-500">Removes tracking and blocking headers.</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="loading-view" class="hidden absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p id="loading-text" class="text-indigo-900 font-medium animate-pulse">Routing connection...</p>
        </div>

        <div id="active-view" class="hidden flex-col flex-1 w-full h-full absolute inset-0 z-0">
            <div class="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs text-indigo-800 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span id="active-status-text">Connected securely</span>
                </div>
                <a id="open-external-btn" href="#" target="_blank" class="hover:text-indigo-600 underline font-medium cursor-pointer">Open without Proxy</a>
            </div>
            
            <iframe id="proxy-iframe" class="w-full h-full border-none bg-white flex-1" title="Proxy Viewer" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
        </div>
    </main>

    <script>
        const locations = [
            { id: 'us-ny', name: 'New York, USA (Local)', icon: '🇺🇸' },
            { id: 'uk-lon', name: 'London, UK (Local)', icon: '🇬🇧' },
            { id: 'de-fra', name: 'Frankfurt, DE (Local)', icon: '🇩🇪' },
        ];
        
        let selectedLocation = locations[0];
        let currentRawUrl = '';
        let isMenuOpen = false;

        const dropdownBtn = document.getElementById('dropdown-btn');
        const dropdownMenu = document.getElementById('dropdown-menu');
        const selectedIcon = document.getElementById('selected-icon');
        const selectedName = document.getElementById('selected-name');
        
        const urlForm = document.getElementById('url-form');
        const urlInput = document.getElementById('url-input');
        const logoBtn = document.getElementById('logo-btn');
        
        const landingView = document.getElementById('landing-view');
        const loadingView = document.getElementById('loading-view');
        const activeView = document.getElementById('active-view');
        const proxyIframe = document.getElementById('proxy-iframe');
        
        const loadingText = document.getElementById('loading-text');
        const activeStatusText = document.getElementById('active-status-text');
        const openExternalBtn = document.getElementById('open-external-btn');

        function renderDropdown() {
            dropdownMenu.innerHTML = '';
            locations.forEach(loc => {
                const btn = document.createElement('button');
                const isSelected = selectedLocation.id === loc.id;
                
                btn.className = "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors " + (isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700");
                btn.innerHTML = '<span class="text-lg">' + loc.icon + '</span><span class="text-sm">' + loc.name + '</span>';
                
                btn.addEventListener('click', () => {
                    selectedLocation = loc;
                    selectedIcon.textContent = loc.icon;
                    selectedName.textContent = loc.name;
                    renderDropdown();
                    toggleMenu(false);
                    if (currentRawUrl) navigate(currentRawUrl);
                });
                dropdownMenu.appendChild(btn);
            });
        }

        function toggleMenu(forceState) {
            isMenuOpen = forceState !== undefined ? forceState : !isMenuOpen;
            if (isMenuOpen) dropdownMenu.classList.remove('hidden');
            else dropdownMenu.classList.add('hidden');
        }

        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) toggleMenu(false);
        });
        dropdownBtn.addEventListener('click', () => toggleMenu());

        function navigate(rawUrl) {
            if (!rawUrl.trim()) return;
            let finalUrl = rawUrl.trim();
            if (!/^https?:\\/\\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

            currentRawUrl = finalUrl;
            urlInput.value = finalUrl;
            
            loadingText.textContent = "Routing connection via " + selectedLocation.name + "...";
            activeStatusText.innerHTML = "Connected securely via " + selectedLocation.icon + " " + selectedLocation.name;
            openExternalBtn.href = finalUrl;

            landingView.classList.add('hidden');
            activeView.classList.add('hidden');
            loadingView.classList.remove('hidden');

            // Hit our custom backend instead of corsproxy.io
            const proxiedUrl = '/proxy?url=' + encodeURIComponent(finalUrl);
            proxyIframe.src = proxiedUrl;
        }

        urlForm.addEventListener('submit', (e) => {
            e.preventDefault();
            navigate(urlInput.value);
        });

        proxyIframe.addEventListener('load', () => {
            if (currentRawUrl) {
                loadingView.classList.add('hidden');
                activeView.classList.remove('hidden');
                activeView.classList.add('flex');
            }
        });

        logoBtn.addEventListener('click', () => {
            currentRawUrl = ''; urlInput.value = ''; proxyIframe.src = '';
            activeView.classList.add('hidden'); activeView.classList.remove('flex');
            loadingView.classList.add('hidden'); landingView.classList.remove('hidden');
        });

        renderDropdown();
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 1. Serve the Frontend UI on the root path
    if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(frontendHTML);
        return;
    }

    let targetUrl = '';

    // If the request is explicitly hitting our proxy endpoint
    if (parsedUrl.pathname === '/proxy') {
        targetUrl = parsedUrl.query.url;
    } 
    // Otherwise, check if an iframe internal resource (like an image/CSS) is requesting a relative path
    else {
        const referer = req.headers.referer;
        if (referer && referer.includes('/proxy?url=')) {
            try {
                const refererUrlObj = new URL(referer);
                const originalTarget = new URL(refererUrlObj.searchParams.get('url'));
                // Append the requested relative path to the original target domain
                targetUrl = originalTarget.origin + req.url;
            } catch (e) {
                // Ignore parse errors on referer
            }
        }
    }

    if (!targetUrl) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    try {
        const targetObj = new URL(targetUrl);
        const protocol = targetObj.protocol === 'https:' ? https : http;
        
        // Prepare headers to look like a normal browser, but masquerade for the target domain
        const options = {
            hostname: targetObj.hostname,
            port: targetObj.port || (targetObj.protocol === 'https:' ? 443 : 80),
            path: targetObj.pathname + targetObj.search,
            method: req.method,
            servername: targetObj.hostname, // Fixes SSL alert number 112 (SNI issue)
            rejectUnauthorized: false,      // Allows connecting to sites with strict SSL validation
            headers: {
                ...req.headers,
                host: targetObj.hostname, 
                origin: targetObj.origin,
                referer: targetObj.origin
            }
        };

        // We delete accept-encoding so the response comes back as plain text (not gzipped)
        // This is necessary so we can read and modify the HTML body below.
        delete options.headers['accept-encoding']; 

        const proxyReq = protocol.request(options, (proxyRes) => {
            // Strip out security headers that block iframes
            const headers = { ...proxyRes.headers };
            delete headers['x-frame-options'];
            delete headers['content-security-policy'];
            delete headers['x-content-security-policy'];
            delete headers['strict-transport-security'];

            // Handle server redirects (301/302) to keep them inside our proxy
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && headers.location) {
                const redirectUrl = new URL(headers.location, targetObj.origin).href;
                headers.location = '/proxy?url=' + encodeURIComponent(redirectUrl);
                res.writeHead(proxyRes.statusCode, headers);
                res.end();
                return;
            }

            // Check if we are receiving an HTML page
            const contentType = headers['content-type'] || '';
            if (contentType.includes('text/html')) {
                // Since we will modify the HTML, the content length will change
                delete headers['content-length'];
                res.writeHead(proxyRes.statusCode, headers);
                
                // Read the HTML response into memory
                let bodyChunks = [];
                proxyRes.on('data', chunk => bodyChunks.push(chunk));
                
                proxyRes.on('end', () => {
                    let htmlStr = Buffer.concat(bodyChunks).toString();
                    
                    // INJECT A <base> TAG: This forces all relative links on the proxied site
                    // (like CSS files, images, etc.) to resolve to the target site instead of our localhost.
                    const baseTag = `<base href="${targetObj.origin}/">`;
                    if (htmlStr.includes('<head>')) {
                        htmlStr = htmlStr.replace('<head>', `<head>${baseTag}`);
                    } else if (htmlStr.includes('<HEAD>')) {
                        htmlStr = htmlStr.replace('<HEAD>', `<HEAD>${baseTag}`);
                    } else {
                        htmlStr = baseTag + htmlStr;
                    }
                    
                    res.end(htmlStr);
                });
            } else {
                // If it's not HTML (e.g. image, script), just stream it through directly
                res.writeHead(proxyRes.statusCode, headers);
                proxyRes.pipe(res);
            }
        });

        // Error handling for the outgoing request
        proxyReq.on('error', (e) => {
            res.writeHead(500);
            res.end('Backend Proxy Error: ' + e.message);
        });

        // Forward the client request body (for POST/PUT requests)
        req.pipe(proxyReq);

    } catch (err) {
        res.writeHead(400);
        res.end('Invalid target URL');
    }
});

server.listen(PORT, () => {
    console.log(`\n✅ GhostProxy Server is running!`);
    console.log(`👉 Open your browser and go to: http://localhost:${PORT}\n`);
});