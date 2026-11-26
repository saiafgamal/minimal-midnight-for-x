// Gets new versions to users sooner. Left alone, Chrome checks the Chrome Web
// Store every few hours and installs an update only once the extension is
// idle. Here, opening x.com asks Chrome to check (at most once an hour), and
// a downloaded update is applied at once.

const CHECK_EVERY_MS = 60 * 60 * 1000;

async function checkForUpdate() {
  const { lastUpdateCheck = 0 } = await chrome.storage.local.get("lastUpdateCheck");
  if (Date.now() - lastUpdateCheck < CHECK_EVERY_MS) return;
  await chrome.storage.local.set({ lastUpdateCheck: Date.now() });
  try {
    // "update_available" is followed by onUpdateAvailable once the new
    // version has downloaded. Chrome answers "throttled" if asked too often.
    await chrome.runtime.requestUpdateCheck();
  } catch {}
}

chrome.runtime.onStartup.addListener(checkForUpdate);

chrome.runtime.onMessage.addListener((message) => {
  if (message === "mmx-page-opened") checkForUpdate();
});

// Applying the update reloads the extension. x.com tabs that are already open
// keep the previous version's theme until they are reloaded; new tabs get the
// new version.
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());
