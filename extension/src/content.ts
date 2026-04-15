// Content Script for Prompt-Shield

interface VaultMap {
  [placeholder: string]: string;
}

interface AnalyzeResponse {
  masked_text: string;
  vault_map: VaultMap;
  entities_found: any[];
}

let currentVault: VaultMap = {};

// Initialize vault from session storage
chrome.storage.session.get(['vault'], (result) => {
  if (result.vault) {
    currentVault = result.vault;
  }
});

// Listen for storage changes to keep tabs in sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'session' && changes.vault) {
    currentVault = changes.vault.newValue || {};
  }
  
  if (namespace === 'sync' && (changes.mode || changes.enterpriseUrl)) {
    // Mode changed, update shield icons
    document.querySelectorAll('.prompt-shield-icon').forEach(icon => {
      const shieldIcon = icon as HTMLElement;
      shieldIcon.style.color = '#3b82f6'; // Reset to blue on settings change
    });
  }
});

// --- In-Line Injection ---

const injectShield = () => {
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const isGemini = window.location.hostname.includes('gemini.google.com');

  if (isChatGPT) {
    injectChatGPT();
  } else if (isGemini) {
    injectGemini();
  }
};

const injectChatGPT = () => {
  const textarea = document.querySelector('#prompt-textarea');
  const inputContainer = textarea?.parentElement;
  if (inputContainer && !document.querySelector('.prompt-shield-icon')) {
    const shieldBtn = createShieldButton();
    // Position it inside the input area, next to the send button
    // ChatGPT's input container usually has a relative position already
    const computedStyle = window.getComputedStyle(inputContainer);
    if (computedStyle.position === 'static') {
      (inputContainer as HTMLElement).style.position = 'relative';
    }
    shieldBtn.style.position = 'absolute';
    shieldBtn.style.right = '44px';
    shieldBtn.style.bottom = '12px';
    shieldBtn.style.zIndex = '100';
    inputContainer.appendChild(shieldBtn);
  }
};


const injectGemini = () => {
  const inputArea = document.querySelector('.input-area-container');
  if (inputArea && !document.querySelector('.prompt-shield-icon')) {
    const shieldBtn = createShieldButton();
    shieldBtn.style.marginRight = '12px';
    shieldBtn.style.marginLeft = '8px';
    shieldBtn.style.marginTop = '4px';
    inputArea.prepend(shieldBtn);
  }
};


const createShieldButton = () => {
  const btn = document.createElement('button');
  btn.className = 'prompt-shield-icon';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
  `;
  btn.style.background = 'none';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.style.color = '#3b82f6';
  btn.title = 'Prompt-Shield Protected';

  // Hover card logic
  btn.addEventListener('mouseenter', showHoverCard);
  btn.addEventListener('mouseleave', hideHoverCard);

  return btn;
};

const showHoverCard = async (e: MouseEvent) => {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const card = document.createElement('div');
  card.id = 'prompt-shield-hover-card';
  card.style.position = 'fixed';
  card.style.top = `${rect.top - 140}px`;
  card.style.left = `${rect.left - 50}px`;
  card.style.background = '#1e293b';
  card.style.color = 'white';
  card.style.padding = '12px';
  card.style.borderRadius = '8px';
  card.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
  card.style.zIndex = '10000';
  card.style.width = '220px';
  card.style.fontSize = '12px';
  card.style.border = '1px solid #334155';
  card.style.pointerEvents = 'none';

  const { mode, enterpriseUrl } = await chrome.storage.sync.get(['mode', 'enterpriseUrl']);
  const currentMode = mode || 'solo';
  const baseUrl = currentMode === 'solo' ? 'http://localhost:8000' : enterpriseUrl;
  
  let status = 'Checking...';
  let statusColor = '#94a3b8';

  try {
    const resp = await fetch(`${baseUrl}/`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (resp.ok) {
      status = 'Online';
      statusColor = '#22c55e';
    } else {
      status = 'Error';
      statusColor = '#f59e0b';
    }
  } catch (err) {
    status = 'Offline';
    statusColor = '#ef4444';
  }

  const maskedCount = Object.keys(currentVault).length;
  const entities = Object.keys(currentVault).slice(0, 3).map(p => p.replace(/[\[\]]/g, '')).join(', ');
  const entitiesList = maskedCount > 0 ? `<div style="margin-top: 4px; color: #94a3b8; font-size: 10px;">${entities}${maskedCount > 3 ? '...' : ''}</div>` : '';
  
  card.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
      <span style="color: #3b82f6;">🛡️</span> Prompt-Shield
    </div>
    <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
      <span>Mode:</span> <b>${currentMode === 'solo' ? 'Solo' : 'Enterprise'}</b>
    </div>
    <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
      <span>Masked:</span> <b>${maskedCount}</b>
    </div>
    ${entitiesList}
    <div style="margin-top: 8px; border-top: 1px solid #334155; pt: 8px; display: flex; align-items: center; gap: 4px;">
      <span style="color: ${statusColor}; font-size: 14px;">●</span> 
      <span style="color: #94a3b8; font-size: 10px;">Proxy: ${status}</span>
    </div>
  `;

  document.body.appendChild(card);
};


const hideHoverCard = () => {
  const card = document.getElementById('prompt-shield-hover-card');
  if (card) card.remove();
};

// Intercept Send
let isProcessing = false;

const interceptSend = async (e: Event) => {
  if (isProcessing) return;

  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const isGemini = window.location.hostname.includes('gemini.google.com');

  let textarea: HTMLElement | null = null;
  let sendButton: HTMLElement | null = null;
  let rawPrompt = '';

  if (isChatGPT) {
    textarea = document.querySelector('#prompt-textarea');
    sendButton = document.querySelector('[data-testid="send-button"]');
    rawPrompt = (textarea as HTMLTextAreaElement)?.value || '';
  } else if (isGemini) {
    // Gemini uses a contenteditable div
    textarea = document.querySelector('div[contenteditable="true"]');
    sendButton = document.querySelector('.send-button-container button') || 
                 document.querySelector('button[aria-label="Send message"]');
    rawPrompt = textarea?.innerText || '';
  }

  if (!textarea || !rawPrompt.trim()) return;

  // If this is a natural send event, stop it and process
  if (e.isTrusted) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    isProcessing = true;
    
    // Show "Shield Masking..." state
    const shieldIcon = document.querySelector('.prompt-shield-icon') as HTMLElement;
    if (shieldIcon) {
      shieldIcon.style.color = '#fbbf24';
      shieldIcon.style.animation = 'pulse 1s infinite';
    }

    try {
      const result = await chrome.storage.sync.get(['mode', 'enterpriseUrl']);
      const mode = result.mode || 'solo';
      const baseUrl = mode === 'solo' ? 'http://localhost:8000' : result.enterpriseUrl;

      if (!baseUrl) throw new Error('No proxy URL configured');

      const response = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawPrompt })
      });

      if (!response.ok) throw new Error('Proxy error');

      const data: AnalyzeResponse = await response.json();
      
      // Update vault
      const newVault = { ...currentVault, ...data.vault_map };
      currentVault = newVault;
      await chrome.storage.session.set({ vault: newVault });

      // Replace text
      if (isChatGPT) {
        (textarea as HTMLTextAreaElement).value = data.masked_text;
      } else {
        textarea.innerText = data.masked_text;
      }
      
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      // Reset shield icon
      if (shieldIcon) {
        shieldIcon.style.color = '#3b82f6';
        shieldIcon.style.animation = 'none';
      }

      // Re-trigger the click/send
      setTimeout(() => {
        isProcessing = false;
        if (sendButton) {
          sendButton.click();
        }
      }, 100);

    } catch (error) {
      console.error('Prompt-Shield error:', error);
      isProcessing = false;
      if (shieldIcon) {
        shieldIcon.style.color = '#ef4444';
        shieldIcon.style.animation = 'none';
        shieldIcon.title = 'Offline - Local Proxy not running';
      }
      
      // Create a non-blocking floating warning instead of alert
      const warning = document.createElement('div');
      warning.textContent = '🛡️ Prompt-Shield Offline: Please start your local proxy at http://localhost:8000 to send safely.';
      warning.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 12px 24px; borderRadius: 8px; zIndex: 10001; boxShadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-weight: bold;';
      document.body.appendChild(warning);
      setTimeout(() => warning.remove(), 5000);
    }
  }
};


// --- Local Rehydration ---

const rehydrateText = (text: string): string => {
  let rehydrated = text;
  Object.entries(currentVault).forEach(([placeholder, original]) => {
    // Escape placeholder for regex
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    // Use function replacement to avoid $ symbol issues in original text
    rehydrated = rehydrated.replace(regex, () => original);
  });
  return rehydrated;
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        const selectors = [
          'p', 'span', 'div.markdown', '.prose', 
          '.model-response', '.message-content',
          '[data-message-author-role="assistant"]'
        ];
        
        const processElement = (target: HTMLElement) => {
          // Avoid re-processing the same element
          if (target.dataset.rehydrated === 'true') return;
          
          if (target.textContent && target.textContent.includes('[')) {
            const originalHTML = target.innerHTML;
            const newHTML = rehydrateText(originalHTML);
            if (originalHTML !== newHTML) {
              // Mark as rehydrated BEFORE updating to avoid observer loops
              target.dataset.rehydrated = 'true';
              target.innerHTML = newHTML;
              
              // Add a subtle blue glow to show it was rehydrated
              target.style.transition = 'background-color 0.5s';
              target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              setTimeout(() => {
                target.style.backgroundColor = 'transparent';
              }, 2000);
            }
          }
        };


        // Check children
        const textElements = el.querySelectorAll(selectors.join(', '));
        textElements.forEach((target) => processElement(target as HTMLElement));

        // Check the element itself if it matches
        if (selectors.some(s => el.matches(s))) {
          processElement(el);
        }
      }
    });
  });
});


observer.observe(document.body, {
  childList: true,
  subtree: true
});

// --- Initialization & Loop ---

const init = () => {
  // Inject shield icon
  injectShield();

  // Attach interceptor to the whole document to catch events early
  // We use capture: true to ensure we get the event before the site's own listeners
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      interceptSend(e);
    }
  }, { capture: true });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const isChatGPTBtn = target.closest('[data-testid="send-button"]');
    const isGeminiBtn = target.closest('.send-button-container button');
    
    if (isChatGPTBtn || isGeminiBtn) {
      interceptSend(e);
    }
  }, { capture: true });
};

// Run init and also periodically check for injection (SPAs)
init();
setInterval(injectShield, 2000);

console.log('🛡️ Prompt-Shield Content Script Loaded');

// CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);

