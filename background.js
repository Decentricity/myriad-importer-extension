chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  const url = changeInfo.url;
  if (!url.includes("twitter.com") && !url.includes("reddit.com")) return;

  const match = url.includes("twitter.com")
    ? url.match(/https:\/\/twitter\.com\/[^\/]+\/status\/(\d+)/)
    : url.match(/https:\/\/www\.reddit\.com\/r\/[^\/]+\/comments\/(\w+)/);

  if (!match) return;

  const postId = match[1];
  const storageKey = `myriadUrl_${tabId}`;

  fetch('https://api.myriad.social/user/posts?pageLimit=200')
    .then(response => response.json())
    .then(data => {
      const post = data.data.find(post => post.originPostId === postId);

      if (!post) {
        chrome.action.setBadgeText({text: '', tabId: tabId});
        return;
      }

      const myriadUrl = `https://app.myriad.social/post/${post.id}`;
      chrome.storage.local.set({[storageKey]: myriadUrl});
      chrome.action.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
      chrome.action.setBadgeText({text: 'i', tabId: tabId});
    })
    .catch(error => console.error('Error:', error));
});
