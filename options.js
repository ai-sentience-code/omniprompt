// options.js
(() => {
    console.log('[options] script loaded');
    const input = document.getElementById('largeInput');
    const sendBtn = document.getElementById('sendToAllPages');
    const checklistContainer = document.getElementById('siteChecklist');
    console.log('[options] elements:', { input, sendBtn, checklistContainer });
  
    // Define default supported sites
    const defaultSites = [
      { url: 'claude.ai',                 inputSelector: '[role="textbox"]',      buttonSelector: 'button[type="submit"]'           },
      { url: 'chatgpt.com',               inputSelector: '#prompt-textarea',       buttonSelector: '#composer-submit-button'         },
      { url: 'aistudio.google.com/prompts', inputSelector: 'textarea',             buttonSelector: 'button[aria-label="Run"]'        },
      { url: 'x.com/i/grok',              inputSelector: 'textarea',               buttonSelector: 'button[type="submit"]'           },
      { url: 'chat.deepseek.com',         inputSelector: 'textarea',               buttonSelector: 'button[type="submit"]'           }
    ];
  
    // Load or initialize sites list with persistence
    chrome.storage.local.get({ sites: [] }, ({ sites }) => {
      console.log('[options] storage.get returned', sites);
      const initial = sites.length
        ? sites
        : defaultSites.map(s => ({ ...s, enabled: true }));
      if (!sites.length) {
        console.log('[options] no stored sites – seeding defaults', initial);
        chrome.storage.local.set({ sites: initial });
      } else {
        console.log('[options] using stored sites', initial);
      }
      renderChecklist(initial);
    });
  
    // Helper to render the checklist
    function renderChecklist(sites) {
      console.log('[options] renderChecklist with sites', sites);
      checklistContainer.innerHTML = '';
      sites.forEach((site, i) => {
        const div = document.createElement('div');
        div.className = 'site-item';
  
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = `site_${i}`;
        cb.dataset.index = i;
        cb.checked = !!site.enabled;
  
        const lbl = document.createElement('label');
        lbl.htmlFor = cb.id;
        lbl.textContent = site.url;
  
        // Persist on toggle
        cb.addEventListener('change', async (e) => {
          console.log(`[options] toggled site[${e.target.dataset.index}] =>`, e.target.checked);
          const { sites: stored } = await chrome.storage.local.get('sites');
          stored[e.target.dataset.index].enabled = e.target.checked;
          console.log('[options] updated stored sites', stored);
          await chrome.storage.local.set({ sites: stored });
        });
  
        div.append(cb, lbl);
        checklistContainer.appendChild(div);
      });
    }
  
    // Send to all pages (background filters by enabled)
    sendBtn.addEventListener('click', () => {
      const promptText = input.value;
      console.log('[options] sendBtn clicked with prompt', promptText);
      chrome.runtime.sendMessage({ action: 'submitAll', prompt: promptText });
    });
  })();
  