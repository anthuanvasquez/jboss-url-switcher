// popup.js

document.addEventListener('DOMContentLoaded', async () => {
  const enabledToggle      = document.getElementById('enabledToggle');
  const toggleLabel        = document.getElementById('toggleLabel');
  const statusDot          = document.getElementById('statusDot');
  const statusText         = document.getElementById('statusText');
  const statusCard         = document.getElementById('statusCard');
  const sourceDomainsEl    = document.getElementById('sourceDomains');
  const targetDomainEl     = document.getElementById('targetDomain');
  const saveBtn            = document.getElementById('saveBtn');
  const saveFeedback       = document.getElementById('saveFeedback');
  const redirectNowSection = document.getElementById('redirectNowSection');
  const redirectNowBtn     = document.getElementById('redirectNowBtn');
  const backSection        = document.getElementById('backToStagingSection');
  const backBtn            = document.getElementById('backToStagingBtn');
  const backUrlEl          = document.getElementById('backUrl');

  // ── Load persisted settings ──────────────────────────────────────────────
  const settings = await chrome.storage.sync.get(['enabled', 'sourceDomains', 'targetDomain']);
  enabledToggle.checked  = settings.enabled || false;
  sourceDomainsEl.value  = settings.sourceDomains || '';
  targetDomainEl.value   = settings.targetDomain  || 'localhost:8090';
  updateToggleLabel(enabledToggle.checked);

  // ── Load last staging URL from session ───────────────────────────────────
  let lastStagingUrl = null;
  try {
    const sessionData = await chrome.storage.session.get(['lastStagingUrl']);
    lastStagingUrl = sessionData.lastStagingUrl || null;
  } catch {}

  if (lastStagingUrl) {
    backSection.classList.remove('hidden');
    backUrlEl.textContent = lastStagingUrl;
    backBtn.title = lastStagingUrl;
  }

  // ── Get current active tab ───────────────────────────────────────────────
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  refreshUI(tab, {
    enabled:       enabledToggle.checked,
    sourceDomains: sourceDomainsEl.value,
    targetDomain:  targetDomainEl.value
  });

  // ── Toggle handler ────────────────────────────────────────────────────────
  enabledToggle.addEventListener('change', async () => {
    const enabled = enabledToggle.checked;
    await chrome.storage.sync.set({ enabled });
    updateToggleLabel(enabled);
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' }).catch(() => {});

    refreshUI(tab, {
      enabled,
      sourceDomains: sourceDomainsEl.value,
      targetDomain:  targetDomainEl.value
    });
  });

  // ── Save handler ─────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    const newSettings = {
      enabled:       enabledToggle.checked,
      sourceDomains: sourceDomainsEl.value,
      targetDomain:  targetDomainEl.value.trim()
    };
    await chrome.storage.sync.set(newSettings);
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' }).catch(() => {});
    refreshUI(tab, newSettings);

    saveFeedback.textContent = '✓ Guardado';
    setTimeout(() => { saveFeedback.textContent = ''; }, 2000);
  });

  // ── Redirect now handler ──────────────────────────────────────────────────
  redirectNowBtn.addEventListener('click', async () => {
    if (!tab || !tab.url) return;

    const currentSettings = await chrome.storage.sync.get(['targetDomain']);
    const rawTarget = (currentSettings.targetDomain || targetDomainEl.value).trim();
    const targetDomain = rawTarget.replace(/^https?:\/\//, '').replace(/\/$/, '');

    let url;
    try {
      url = new URL(tab.url);
    } catch {
      return;
    }

    const newUrl = `http://${targetDomain}${url.pathname}${url.search}${url.hash}`;

    try {
      await chrome.storage.session.set({ lastStagingUrl: tab.url });
    } catch {}

    chrome.tabs.update(tab.id, { url: newUrl });
    window.close();
  });

  // ── Back to staging handler ───────────────────────────────────────────────
  backBtn.addEventListener('click', async () => {
    if (!tab || !lastStagingUrl) return;
    chrome.tabs.update(tab.id, { url: lastStagingUrl });
    window.close();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function refreshUI(currentTab, currentSettings) {
    const enabled      = currentSettings.enabled;
    const sourceDomains = currentSettings.sourceDomains || '';
    const matches      = currentTab?.url
      ? checkUrlMatches(currentTab.url, sourceDomains)
      : false;

    // Status dot + text
    if (!currentTab?.url || !['http:', 'https:'].includes(getProtocol(currentTab.url))) {
      statusDot.className  = 'status-dot inactive';
      statusText.textContent = 'Página sin URL válida';
      statusCard.classList.remove('matching');
    } else if (!enabled) {
      statusDot.className  = 'status-dot inactive';
      statusText.textContent = 'Redirección desactivada';
      statusCard.classList.remove('matching');
    } else if (matches) {
      statusDot.className  = 'status-dot matching';
      statusText.textContent = 'Dominio configurado — listo para redirigir';
      statusCard.classList.add('matching');
    } else {
      statusDot.className  = 'status-dot active';
      statusText.textContent = 'Dominio no en la lista';
      statusCard.classList.remove('matching');
    }

    // Show "Redirigir ahora" only when enabled and on a matching domain
    if (enabled && matches) {
      redirectNowSection.classList.remove('hidden');
    } else {
      redirectNowSection.classList.add('hidden');
    }
  }

  function updateToggleLabel(enabled) {
    toggleLabel.textContent = enabled ? 'Activo' : 'Desactivado';
  }

  function getProtocol(urlString) {
    try { return new URL(urlString).protocol; } catch { return ''; }
  }

  function checkUrlMatches(urlString, sourceDomains) {
    if (!urlString || !sourceDomains) return false;
    let url;
    try { url = new URL(urlString); } catch { return false; }

    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const domains = sourceDomains
      .split('\n')
      .map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''))
      .filter(d => d.length > 0);

    const currentHost = url.hostname + (url.port ? ':' + url.port : '');
    return domains.some(domain =>
      currentHost.toLowerCase() === domain.toLowerCase() ||
      url.hostname.toLowerCase() === domain.toLowerCase()
    );
  }
});
