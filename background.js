const clientId = '2ujezphm87cg7ii7d8jvu8if66wwe7';
const clientSecret = 'g35oxxgt6jhohutf4fh6come760640';
const links = ['Twitch', 'Kick', 'YouTube', 'Reddit', 'Discord', 'Twitter', 'Instagram'];
let accessToken;
let url;

chrome.alarms.create({ periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(getLiveStatus);

async function getLiveStatus() {
  const isLiveKick = await getKickStatus();
  const isLiveTwitch = await getTwitchStatus();

  if (!isLiveKick && !isLiveTwitch) {
    setTitleOffline();
    return false
  }
  return true;
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

chrome.action.onClicked.addListener(async () => {
  if (await getLiveStatus()) {
    chrome.tabs.create({ url });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: 'Links',
    type: 'normal',
    id: 'Links',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    type: 'separator',
    id: 'Sep1',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    title: 'Donate',
    type: 'normal',
    id: 'Donate',
    contexts: ['action']
  });

  links.forEach(link => {
    chrome.contextMenus.create({
      title: link,
      type: 'normal',
      id: link,
      parentId: 'Links',
      contexts: ['action']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  switch (info.menuItemId) {
    case 'Donate':
      chrome.tabs.create({ url: 'https://www.paypal.com/donate/?hosted_button_id=Q4VZ2M4UQ93VS' });
      break;
    case 'Twitch':
      chrome.tabs.create({ url: 'https://www.twitch.tv/xqc' });
      break;
    case 'Kick':
      chrome.tabs.create({ url: 'https://www.kick.com/xqc' });
      break;
    case 'Reddit':
      chrome.tabs.create({ url: 'https://www.reddit.com/r/xqcow/' });
      break;
    case 'Twitter':
      chrome.tabs.create({ url: 'https://X.com/xqc' });
      break;
    case 'Instagram':
      chrome.tabs.create({ url: 'https://www.instagram.com/xqcow1/' });
      break;
    case 'Discord':
      chrome.tabs.create({ url: 'https://discord.com/invite/xqcow' });
      break;
    case 'YouTube':
      chrome.tabs.create({ url: 'https://www.youtube.com/@xQcOW/videos' });
      break;
    default:
      break;
  }
});

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

getLiveStatus();
