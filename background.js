// background.js — Service Worker

function checkUrlMatches(urlString, sourceDomains) {
  if (!urlString || !sourceDomains) return false;

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  // Only match http/https pages
  if (!['http:', 'https:'].includes(url.protocol)) return false;

  const domains = sourceDomains
    .split('\n')
    .map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''))
    .filter(d => d.length > 0);

  const currentHost = url.hostname + (url.port ? ':' + url.port : '');

  return domains.some(domain => {
    const normalizedDomain = domain.toLowerCase();
    return (
      currentHost.toLowerCase() === normalizedDomain ||
      url.hostname.toLowerCase() === normalizedDomain
    );
  });
}

async function updateBadgeForTab(tabId) {
  const settings = await chrome.storage.sync.get(['enabled', 'sourceDomains']);
  const enabled = settings.enabled || false;

  if (!enabled) {
    try {
      await chrome.action.setBadgeText({ text: '', tabId });
    } catch {}
    return;
  }

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return;
  }

  const matches = tab.url
    ? checkUrlMatches(tab.url, settings.sourceDomains || '')
    : false;

  try {
    if (matches) {
      await chrome.action.setBadgeText({ text: '→', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#e67e22', tabId });
    } else {
      await chrome.action.setBadgeText({ text: 'ON', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#27ae60', tabId });
    }
  } catch {}
}

// Update badge on tab navigation (no auto-redirect)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateBadgeForTab(tabId);
  }
});

// Update badge when user switches tabs
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadgeForTab(tabId);
});

// Keyboard shortcut: Alt+Shift+J to toggle
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-redirect') return;

  const settings = await chrome.storage.sync.get(['enabled']);
  const newEnabled = !settings.enabled;
  await chrome.storage.sync.set({ enabled: newEnabled });

  // Update badge on active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) updateBadgeForTab(tab.id);
});

// Listen for messages from popup (settings changed)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SETTINGS_UPDATED') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) updateBadgeForTab(tab.id);
    });
  }
});
