document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        statusDiv.style.background = isError ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)';
    }

    exportBtn.addEventListener('click', async function() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url) {
                showStatus('No active tab found!', true);
                return;
            }

            // Extract domain from URL
            const url = new URL(tab.url);
            const domain = url.hostname;

            // Get all cookies for this domain
            const cookies = await chrome.cookies.getAll({ domain: domain });
            
            if (cookies.length === 0) {
                showStatus('No cookies found for this domain!', true);
                return;
            }

            // Prepare export data
            const exportData = {
                url: tab.url,
                domain: domain,
                timestamp: new Date().toISOString(),
                cookies: cookies.map(cookie => ({
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    expirationDate: cookie.expirationDate
                }))
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const downloadUrl = URL.createObjectURL(blob);
            
            const filename = `cloud-portal-session-${domain}-${Date.now()}.json`;
            
            await chrome.downloads.download({
                url: downloadUrl,
                filename: filename,
                saveAs: true
            });

            showStatus(`✅ Exported ${cookies.length} cookies!`);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            
        } catch (error) {
            console.error('Export error:', error);
            showStatus('Error: ' + error.message, true);
        }
    });
});
