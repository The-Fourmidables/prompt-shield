// Background script for Prompt-Shield

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt-Shield extension installed');
  
  // Set default settings
  chrome.storage.sync.get(['mode'], (result) => {
    if (!result.mode) {
      chrome.storage.sync.set({ mode: 'solo' });
    }
  });
});

// Handle requests from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_MODE') {
    chrome.storage.sync.get(['mode', 'enterpriseUrl'], (result) => {
      sendResponse({ mode: result.mode || 'solo', enterpriseUrl: result.enterpriseUrl || '' });
    });
    return true; // Keep message channel open for async response
  }
});
