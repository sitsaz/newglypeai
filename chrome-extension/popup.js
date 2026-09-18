document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const exportStatus = document.getElementById('exportStatus');
    const fileInfo = document.getElementById('fileInfo');

    function showStatus(element, message, isError = false) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.background = isError ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Export handler - downloads cookies as a JSON file
    exportBtn.addEventListener('click', async function() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url) {
                showStatus(exportStatus, 'No active tab found!', true);
                return;
            }

            // Extract domain from URL
            const url = new URL(tab.url);
            const domain = url.hostname;

            // Get all cookies for this domain
            const cookies = await chrome.cookies.getAll({ domain: domain });
            
            if (cookies.length === 0) {
                showStatus(exportStatus, 'No cookies found for this domain!', true);
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
                    domain: cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite === 'unspecified' || !cookie.sameSite ? 'Lax' : cookie.sameSite,
                    expirationDate: cookie.expirationDate || null
                }))
            };

            // Create a blob and download the file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `cloud-portal-session-${domain}-${new Date().getTime()}.json`;

            // Use Chrome downloads API to save the file
            const downloadUrl = URL.createObjectURL(blob);
            
            chrome.downloads.download({
                url: downloadUrl,
                filename: fileName,
                saveAs: true
            }, function(downloadId) {
                if (chrome.runtime.lastError) {
                    throw new Error(chrome.runtime.lastError.message);
                }
                showStatus(exportStatus, `✅ Exported ${cookies.length} cookies to file!`);
                fileInfo.textContent = `File: ${fileName}`;
                fileInfo.style.display = 'block';
            });
            
        } catch (error) {
            console.error('Export error:', error);
            showStatus(exportStatus, 'Error: ' + error.message, true);
        }
    });
});
