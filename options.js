const toggle = document.getElementById('notifications');

chrome.storage.sync.get(['notifications'], (result) => {
  toggle.checked = result.notifications ?? false;
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ notifications: toggle.checked });
});
