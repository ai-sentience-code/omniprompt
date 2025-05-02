// Full updated background.js

console.log('[background] service worker loaded');

chrome.runtime.onMessage.addListener(async (msg) => {
  console.log('[background] onMessage received', msg);
  if (msg.action !== 'submitAll') return;
  console.log('[background] action=submitAll – processing');

  // Load stored sites and migrate chatgpt.com selectors if needed
  let { sites = [] } = await chrome.storage.local.get('sites');
  const migrated = sites.map(site => {
    if (site.url === 'chatgpt.com') {
      return {
        ...site,
        inputSelector: '#prompt-textarea',
        buttonSelector: '#composer-submit-button'
      };
    }
    return site;
  });
  if (JSON.stringify(migrated) !== JSON.stringify(sites)) {
    console.log('[background] migrating chatgpt.com selectors in storage');
    await chrome.storage.local.set({ sites: migrated });
    sites = migrated;
  }
  console.log('[background] loaded sites from storage (post-migration)', sites);

  const enabledSites = sites.filter(s => s.enabled);
  console.log('[background] enabledSites', enabledSites);
  if (!enabledSites.length) return;

  const allTabs = await chrome.tabs.query({});
  console.log('[background] all open tabs:', allTabs.map(t => ({ id: t.id, url: t.url })));

  for (const site of enabledSites) {
    console.log('[background] processing site', site.url);
    const matching = allTabs.filter(tab => tab.url && tab.url.includes(site.url));
    console.log(`[background] matching tabs for ${site.url}`, matching.map(t => t.id));

    for (const tab of matching) {
      console.log('[background] focusing tab', tab.id);
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      console.log('[background] tab and window focused');

      console.log('[background] injecting into tab', tab.id);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (promptText, inputSel, buttonSel) => {
            function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
            (async () => {
              // 1) Give the page time to render
              await wait(500);

              // 2) Find and focus the editor
              const editor = document.querySelector(inputSel);
              if (!editor) {
                console.error('❌ Editor not found:', inputSel);
                return;
              }
              editor.click();
              await wait(50);
              editor.focus();

              // 3) Insert text via execCommand
              document.execCommand('selectAll', false, null);
              document.execCommand('insertText', false, promptText);
              editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

              // 4) Pause before attempting to send
              await wait(500);

              // 5) Enable & click the send button
              const btn = document.querySelector(buttonSel);
              if (!btn) {
                console.error('❌ Send button not found:', buttonSel);
                return;
              }
              btn.disabled = false;
              btn.removeAttribute('disabled');
              btn.scrollIntoView({ block: 'center' });
              btn.click();

              // 6) Fallback: simulate Enter key on editor
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                bubbles: true, cancelable: true
              });
              editor.dispatchEvent(enterEvent);
            })();
          },
          args: [msg.prompt, site.inputSelector, site.buttonSelector]
        });
        console.log('[background] injection with delay initiated on tab', tab.id);
      } catch (err) {
        console.error('[background] injection failed on tab', tab.id, err);
      }
    }
  }
});

// Open full-page UI on icon click
chrome.action.onClicked.addListener(() => {
  console.log('[background] icon clicked – opening options page');
  chrome.runtime.openOptionsPage();
});
