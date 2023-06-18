chrome.alarms.create({ periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(isLive);

async function isLive() {
  const twitchLiveStatus = await isLiveOnTwitch();
  const kickLiveStatus = await isLiveOnKick();

  if (!twitchLiveStatus && !kickLiveStatus) {
    setTitleOffline();
  }
}

async function isLiveOnTwitch() {
  const response = await fetch('https://api.twitch.tv/helix/streams?user_login=xqc', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer l5lb7e7jvg8v4ern55srcl96m2d8ay',
      'Client-ID': '2ujezphm87cg7ii7d8jvu8if66wwe7'
    }
  });
  if (!response.ok) {
    throw new Error(`Error! Status: ${response.status}`);
  }
  const data = await response.json();
  const streamData = data.data[0];
  if (streamData && streamData.type === 'live') {
    setTitleLive('#eb0400', streamData.title, streamData.game_name, streamData.viewer_count);
    url = 'https://www.twitch.tv/xqc';
    return true;
  }
  return false;
}

async function isLiveOnKick() {
  const response = await fetch('https://kick.com/api/v2/channels/xqc');
  if (!response.ok) {
    throw new Error(`Error! Status: ${response.status}`);
  }
  const data = await response.json();
  const streamData = data;
  if (streamData && streamData.livestream !== null) {
    setTitleLive('#53fc18', streamData.livestream.session_title, streamData.livestream.categories[0].name, streamData.livestream.viewer_count);
    url = 'https://www.kick.com/xqc';
    return true;
  }
  return false;
}

function setTitleLive(color, title, game, viewers) {
  chrome.action.setBadgeText({
    text: 'LIVE'
  });
  chrome.action.setBadgeBackgroundColor({
    color: color
  });
  chrome.action.setTitle({
    title: `xQc\n${title}\n${game}\n${viewers} 🤓`
  });
}

function setTitleOffline() {
  chrome.action.setBadgeText({
    text: ''
  });
  chrome.action.setTitle({
    title: 'xQc\nOFFLINE'
  });
}

let url = 'https://www.twitch.tv/xqc';
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url });
});

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

isLive();
