const clientId = '2ujezphm87cg7ii7d8jvu8if66wwe7';
const clientSecret = 'g35oxxgt6jhohutf4fh6come760640';
let accessToken = '';
let url = null;
let isLive = false;

chrome.alarms.create({ periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(getLiveStatus);

async function getLiveStatus() {
  const isLiveKick = await getKickStatus();
  const isLiveTwitch = await getTwitchStatus();

  if (!isLiveKick && !isLiveTwitch) {
    setTitleOffline();
    isLive = false;
  } else {
    isLive = true;
  }
}

async function getKickStatus() {
  try {
    const response = await fetch('https://kick.com/api/v2/channels/xqc');
    if (!response.ok) {
      throw new Error(`Error! Status: ${response.status}`);
    }
    const streamData = await response.json();
    if (streamData?.livestream !== null) {
      setTitleLive('#53fc18', streamData.livestream.session_title, streamData.livestream.categories[0].name, streamData.livestream.viewer_count);
      url = 'https://www.kick.com/xqc';
      return true;
    }
  } catch (error) {
    console.log(error);
  }
  return false;
}

async function getTwitchStatus() {
  try {
    const response = await fetch('https://api.twitch.tv/helix/streams?user_login=xqc', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': clientId
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        getTwitchToken();
        return false;
      }
      throw new Error(`Error! Status: ${response.status}`);
    }
    const data = await response.json();
    const streamData = data.data[0];
    if (streamData && streamData.type === 'live') {
      setTitleLive('#eb0400', streamData.title, streamData.game_name, streamData.viewer_count);
      url = 'https://www.twitch.tv/xqc';
      return true;
    }
  } catch (error) {
    console.log(error);
  }
  return false;
}

async function getTwitchToken() {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    });
    if (!response.ok) {
      throw new Error(`Error! Status: ${response.status}`);
    }
    const data = await response.json();
    accessToken = data.access_token;
  } catch (error) {
    console.log(error);
  }
  getLiveStatus();
}

function setTitleLive(color, title, game, viewers) {
  chrome.action.setBadgeText({
    text: 'LIVE',
  });
  chrome.action.setBadgeBackgroundColor({
    color: color,
  });
  chrome.action.setTitle({
    title: `${title}\n${game}\n${viewers} 🤓`,
  });
}

function setTitleOffline() {
  chrome.action.setBadgeText({
    text: '',
  });
  chrome.action.setTitle({
    title: 'OFFLINE',
  });
}

chrome.action.onClicked.addListener(() => {
  if (isLive) {
    chrome.tabs.create({ url });
  }
});

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

getLiveStatus();
