const CLIENT_ID = '2ujezphm87cg7ii7d8jvu8if66wwe7';
const CLIENT_SECRET = 'g35oxxgt6jhohutf4fh6come760640';
const LINKS = ['Twitch', 'Kick', 'Vods', 'YouTube', 'Reddit', 'Discord', '𝕏'];
const TWITCH = 'https://www.twitch.tv/xqc';
const KICK = 'https://www.kick.com/xqc';
const FIVE_MINUTES = 5 * 60;

let accessToken;
let url;

class LiveStatus {
  constructor({ color, title, game, viewers, duration, url }) {
    this.color = color;
    this.title = title;
    this.game = game;
    this.viewers = viewers;
    this.duration = duration;
    this.url = url;
  }

  static fromKick(streamData) {
    return new LiveStatus({
      color: '#53fc18',
      title: streamData.livestream.session_title,
      game: streamData.livestream.categories?.[0]?.name,
      viewers: streamData.livestream.viewer_count,
      duration: calculateDurationInSeconds(formatUtcString(streamData.livestream.start_time)),
      url: KICK
    });
  }

  static fromTwitch(streamData) {
    return new LiveStatus({
      color: '#eb0400',
      title: streamData.title,
      game: streamData.game_name,
      viewers: streamData.viewer_count,
      duration: calculateDurationInSeconds(streamData.started_at),
      url: TWITCH
    });
  }
}

chrome.alarms.create({ periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(getLiveStatus);

async function getLiveStatus() {
  const isLiveTwitch = await getTwitchStatus();
  const isLiveKick = await getKickStatus();

   if (!isLiveKick && !isLiveTwitch) {
    setTitleOffline();
    return false;
  }

  chrome.storage.sync.get(['prioritization'], (result) => {
    if (result.prioritization === 'Twitch' && isLiveTwitch) {
      setTitleLive(isLiveTwitch);
    } else if (result.prioritization === 'Kick' && isLiveKick) {
      setTitleLive(isLiveKick);
    } else if (isLiveKick) {
      setTitleLive(isLiveKick);
    } else if (isLiveTwitch) {
      setTitleLive(isLiveTwitch);
    }
  });

  return true;
}

async function getKickStatus() {
  try {
    const response = await fetch('https://kick.com/api/v2/channels/xqc');
    if (!response.ok) {
      throw new Error(`Error! Status: ${response.status}`);
    }
    const streamData = await response.json();
    if (streamData?.livestream) {
      return LiveStatus.fromKick(streamData);
    }
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function getTwitchStatus() {
  try {
    const response = await fetch('https://api.twitch.tv/helix/streams?user_login=xqc', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': CLIENT_ID
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        getTwitchToken();
        return null;
      }
      throw new Error(`Error! Status: ${response.status}`);
    }
    const data = await response.json();
    const streamData = data.data[0];
    if (streamData && streamData.type === 'live') {
      return LiveStatus.fromTwitch(streamData);
    }
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function getTwitchToken() {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
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

function calculateDurationInSeconds(startTime) {
  const duration = Date.now() - new Date(startTime);
  return Math.floor(duration / 1000);
}

function formatUtcString(input) {
  return input.replace(" ", "T") + "Z";
}

function setTitleLive(status) {
  url = status.url;
  
  chrome.action.setBadgeText({
    text: 'LIVE',
  });
  chrome.action.setBadgeBackgroundColor({
    color: status.color,
  });
  chrome.action.setTitle({
    title: `${status.title}\n${status.game}\n👤 ${status.viewers}`,
  });
  
  if (status.duration < 60) {
    sendNotification(status.title, status.game);
  }
}

function setTitleOffline() {
  chrome.action.setBadgeText({
    text: '',
  });
  chrome.action.setTitle({
    title: 'OFFLINE',
  });
}

function sendNotification(title, game) {
  chrome.storage.sync.get(['notifications'], (result) => {
    if (result.notifications ?? false) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/monkey-128.png',
        title: `${url === KICK ? '🟢' : '🔴'} xQc is live!`,
        message: `${title}\n${game}`
      });
    }
  });
}

chrome.notifications.onClicked.addListener(() => {
  if (url) {
    chrome.tabs.create({ url });
  }
});

chrome.action.onClicked.addListener(async () => {
  const isLive = await getLiveStatus();

  if (isLive) {
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
    title: 'Donate 🪙',
    type: 'normal',
    id: 'Donate',
    contexts: ['action']
  });

  LINKS.forEach(link => {
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
    case '𝕏':
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
    case 'Vods':
      chrome.tabs.create({ url: 'https://xqc.wtf/' });
      break;
    default:
      break;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateLiveStatus') {
    getLiveStatus();
  }
});

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

getTwitchToken();