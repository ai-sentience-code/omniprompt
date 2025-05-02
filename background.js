// Full updated background.js

console.log('[background] service worker loaded');

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.action !== 'submitAll') return;
  console.log('[background] action=submitAll – processing');

  // Load and filter enabled sites
  const { sites = [] } = await chrome.storage.local.get('sites');
  const enabledSites = sites.filter(s => s.enabled);
  console.log('[background] enabledSites', enabledSites);

  // Process each site sequentially
  for (const site of enabledSites) {
    console.log('[background] processing site', site.url);

    // Only inject into tabs the user has already opened
    const tabs = await chrome.tabs.query({ url: `*://${site.url}/*` });
    if (!tabs.length) {
      console.log(`[background] no open tab for ${site.url}, skipping`);
      continue;
    }

    // Inject into each matching tab
    for (const tab of tabs) {
      console.log('[background] focusing tab', tab.id);
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      await new Promise(r => setTimeout(r, 300));

      console.log('[background] injecting into tab', tab.id);
      try {
        if (site.url === 'chatgpt.com') {
          // ChatGPT-specific injection
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (promptText) => {
              const wait = ms => new Promise(r => setTimeout(r, ms));
              (async () => {
                await wait(500);
                const pm = document.getElementById('prompt-textarea');
                if (!pm) return console.error('ChatGPT editor not found');
                pm.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, promptText);
                pm.dispatchEvent(new InputEvent('input', { bubbles: true }));
                await wait(500);
                const btn = document.querySelector('#composer-submit-button');
                if (!btn) return console.error('ChatGPT send button not found');
                btn.click();
              })();
            },
            args: [msg.prompt]
          });

        } else if (site.url === 'claude.ai') {
          // Claude.ai-specific injection
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (promptText) => {
              const wait = ms => new Promise(r => setTimeout(r, ms));
              (async () => {
                await wait(500);
                const editor = document.querySelector('.ProseMirror');
                if (!editor) return console.error('Claude editor not found');
                editor.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, promptText);
                editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
                await wait(500);
                const btn = document.querySelector('button[aria-label="Send message"]');
                if (!btn) return console.error('Claude send button not found');
                btn.click();
              })();
            },
            args: [msg.prompt]
          });

        } else {
          // Generic fallback injection
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (promptText, inputSel, buttonSel) => {
              const wait = ms => new Promise(r => setTimeout(r, ms));
              (async () => {
                await wait(500);
                const inp = document.querySelector(inputSel);
                const btn = document.querySelector(buttonSel);
                if (inp) inp.value = promptText;
                if (btn) btn.click();
              })();
            },
            args: [msg.prompt, site.inputSelector, site.buttonSelector]
          });
        }
        console.log('[background] injection succeeded for', site.url);
      } catch (err) {
        console.error('[background] injection failed for', site.url, err);
      }

      // Wait a bit before processing the next tab
      await new Promise(r => setTimeout(r, 1500));
    }
  }
});

// Open full-page UI on icon click
chrome.action.onClicked.addListener(() => {
  console.log('[background] icon clicked – opening options page');
  chrome.runtime.openOptionsPage();
});
