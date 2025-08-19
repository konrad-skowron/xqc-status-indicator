const toggle = document.getElementById('notifications');
const prioritizationSelect = document.getElementById('prioritization');

chrome.storage.sync.get(['notifications', 'prioritization'], (result) => {
  toggle.checked = result.notifications ?? false;
  prioritizationSelect.value = result.prioritization ?? 'Twitch';
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ notifications: toggle.checked });
});

prioritizationSelect.addEventListener('change', () => {
  chrome.storage.sync.set({ prioritization: prioritizationSelect.value });
  chrome.runtime.sendMessage({ action: 'updateLiveStatus' });
});
