// Background service worker for handling download operations
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cloud Portal Session Exporter installed');
});

// Handle download completion
chrome.downloads.onChanged.addListener((downloadItem) => {
  if (downloadItem.state && downloadItem.state.current === 'complete') {
    console.log('Session file downloaded successfully:', downloadItem.id);
  }
});
