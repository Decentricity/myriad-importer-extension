var loginData = {
  accessToken: null,
  username: null
};


function dataURLToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


function displayUserFeedback(messageText, isSuccess = true) {
  // Create a new message element
  let messageElement = document.createElement('div');

  // Add classes to the message
  messageElement.className = 'message ' + (isSuccess ? 'success' : 'error');

  // Set the text content of the message
  messageElement.textContent = messageText;

  // Append the message to the body
  document.body.appendChild(messageElement);

  // After 6 seconds, remove the message
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 6000);
}

base_url='https://api.myriad.social';
function createMyriadPost(title, textBlocks, platform = 'myriad', visibility = 'public') {
  
  const apiEndpoint = `${base_url}/user/posts`;

  fetch(`${base_url}/users/${loginData.username}`, {
    headers: {
        'Authorization': `Bearer ${loginData.accessToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(user_data => {
    const createdBy = user_data.id;

    let now = new Date();

    let createdAt = now.toISOString();

    let text = textBlocks.join('\n');

    let post_data = {
        "rawText": text,
        "text": text,
        "status": "published",
        "selectedTimelineIds": [],
        "createdBy": createdBy,
        "createdAt": createdAt,
        "platform": platform,
        "visibility": visibility
    };

    return fetch(apiEndpoint, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.accessToken}`
      },
      body: JSON.stringify(post_data)
    })
  })
  .then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Post created successfully!');
    displayUserFeedback('Post created successfully!', true);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

//Alex check below
// When the popup is opened, get the active tab URL.
chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
  let url = tabs[0].url;
  const iframe = document.getElementById('myriad_iframe');
  iframe.style.display = 'none';

  // If the active page is Twitter
  if (url.includes("twitter.com")) {
    // Check if the URL is of the format "https://twitter.com/{username}/status/{postid}"
    const match = url.match(/https:\/\/twitter\.com\/[^\/]+\/status\/(\d+)/);
    processMatch(match);
  }

  // If the active page is Reddit
  if (url.includes("reddit.com")) {
    // Check if the URL is of the format "https://www.reddit.com/r/{subreddit}/comments/{alphanumeric}/{title}/"
    const match = url.match(/https:\/\/www\.reddit\.com\/r\/[^\/]+\/comments\/(\w+)/);
    processMatch(match);
  }
  
  function processMatch(match) {
    if (match) {
      const postId = match[1];
      
      // Perform a GET request to the API
      fetch('https://api.myriad.social//user/posts?pageLimit=200')
        .then(response => response.json())
        .then(data => {
          // Find the post with the same "originPostId" as our "postid"
          const post = data.data.find(post => post.originPostId === postId);
          
          // Get the iframe and other elements
          const emailField = document.getElementById('emailfield');
          const magicLink = document.getElementById('magiclink');
          const postDiv = document.getElementById('post');
          const importDiv = document.getElementById('import');
          
          if (post) {
            // Construct the Myriad URL
            const myriadUrl = `https://app.myriad.social/post/${post.id}`;
            
            // Set the source of the iframe
            iframe.src = myriadUrl;

            // Show the iframe and hide the other elements
            iframe.style.display = 'block';
            emailField.style.display = 'none';
            magicLink.style.display = 'none';
            postDiv.style.display = 'none';
            importDiv.style.display = 'none';
          } else {
            // Hide the iframe and show the other elements
            iframe.style.display = 'none';
            console.log('Post not found in API response.');
          }
        })
        .catch(error => console.error('Error:', error));
    }
  }
});


document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function () {
            this.style.backgroundColor = '#ffd24d';
        });
    }

    var writePostButton = document.getElementById('write_post_button');
    var submitPostButton = document.getElementById('submit_post_button');
    var postContent = document.getElementById('post_content');

    writePostButton.addEventListener('click', function () {
        postContent.style.display = 'block';
        submitPostButton.style.display = 'inline-block';
    });

    submitPostButton.addEventListener('click', function () {
        let content = postContent.value;
        if (content) {
            let title = 'Title';
            let textBlocks = content.split('\n');

            createMyriadPost(title, textBlocks);
            postContent.value = '';
            postContent.style.display = 'none';
            this.style.display = 'none';
        }
    });

    document.getElementById('send_magic_link').addEventListener('click', function () {
        var email = document.getElementById('email').value;
        sendMagicLink(email);
    });

    document.getElementById('submit_magic_link').addEventListener('click', function () {
        var magicLink = document.getElementById('magic_link').value;
        authenticate(magicLink);
    });
    
    
    
document.getElementById('import_post').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var currentUrl = tabs[0].url;
        if (currentUrl.includes('twitter.com') || currentUrl.includes('reddit.com')) {
            importTwitterPost(currentUrl);
        } else if (currentUrl.includes('youtube.com')) {
            let text = `<iframe width="100%" height="315" src="${currentUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
            if (text.includes('watch?v=')) {
                text = text.replace('watch?v=', 'embed/');
            }
            let content = postContent.value;
            let title = 'Title';

            let textBlocks = [text];
            if (content) {
                textBlocks.unshift(content.split('</p><p>'));
            }
            // Create Myriad Post
            createMyriadPost(title, textBlocks, 'myriad', 'public');
            postContent.value = '';
            postContent.style.display = 'none';
            this.style.display = 'none';
        } else if (currentUrl.includes('twitch.tv/')) {
            const url = new URL(currentUrl);
            let twitchUser = url.pathname.substring(1);
            let text = `<iframe src="https://player.twitch.tv/?channel=${twitchUser}&parent=app.myriad.social" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="100%"></iframe>`

            let textBlocks = [text];
            let title = 'Title';
            let content = postContent.value;
            if (content) {
                textBlocks.unshift(content.split('</p><p>'));
            }
            // Create Myriad Post
            createMyriadPost(title, textBlocks, 'myriad', 'public');
            postContent.value = '';
            postContent.style.display = 'none';
            this.style.display = 'none';
        } else {
            // Request the content script to scrape the page
            chrome.tabs.sendMessage(tabs[0].id, { message: "get_selected_text" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                var textBlocks = response.data;  // The data sent by the content script

                // Capture the screenshot
                chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
                    var blob = dataURLToBlob(dataUrl);

                    var formData = new FormData();
                    formData.append("file", blob, `screenshot.png`);

                    fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                        method: "POST",
                        headers: {
          "pinata_api_key": "c02a1bfa838c22fc7bad",
                "pinata_secret_api_key": "6c8f435859846704f6fc53686a4d4aaf39d25bb055bbe748d91532f164e9e11f",
                        },
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        // Log Pinata response
                        console.log('Pinata response:', data);
                        // Add the IPFS link to the text
                        textBlocks.unshift(`<p><center><a href="https://ipfs.io/ipfs/${data.IpfsHash}">IPFS Link</a><center></p>`);
                        // Add the screenshot to the text
                        textBlocks.unshift(`<p><img src="https://ipfs.io/ipfs/${data.IpfsHash}" alt="Imported Screenshot"></p>`);
                        // Add the introductory sentence
                        textBlocks.unshift(`<p>Imported from <a href="${currentUrl}">${currentUrl}</a>:</p>`);

                        // Prepare title
                        var title = currentUrl; // Or any suitable title

                        // Create Myriad Post
                        createMyriadPost(title, textBlocks, 'myriad', 'public');
                    });
                });
            });
        }
    });
});




});



function checkLogin() {
    var importbuttonElement = document.getElementById('import_post');
importbuttonElement.innerText = importbuttonElement.textContent = 'new text';
     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
       var currentUrl = tabs[0].url;
       var contextElement = document.getElementById('contextof');
           if (currentUrl.includes('twitter.com') || currentUrl.includes('reddit.com')) {
       //displayUserFeedback(`The current page is natively importable to Myriad!`, true);
       contextElement.innerText = "The current page is natively importable to Myriad! ";
      importbuttonElement.innerText = importbuttonElement.textContent = 'Import Post';
    } else if (currentUrl.includes('youtube.com') || currentUrl.includes('twitch.tv')) {
        contextElement.innerText = "The current page can be embedded into a Myriad post! "; 
        importbuttonElement.innerText = importbuttonElement.textContent = 'Embed Video';
    } else {
        contextElement.innerText = "The current page can only be archived to Myriad via IPFS!";
        importbuttonElement.innerText = importbuttonElement.textContent = 'Archive Content';
    }        
     
     
     })

// Retrieve the "accessToken" and "username" from local storage
var accessToken = localStorage.getItem("accessToken");
var username = localStorage.getItem("username");
if (accessToken && username) {
      loginData.accessToken = accessToken;
      loginData.username = username;

      var preloginElement = document.getElementById('prelogin');
      if (preloginElement) {
        preloginElement.innerText = "Logged in as: " + username;
      }

      document.getElementById('email').style.display = 'none';
      document.getElementById('magic_link').style.display = 'none';
      document.getElementById('send_magic_link').style.display = 'none';
      document.getElementById('submit_magic_link').style.display = 'none';
      
      document.getElementById('write_post_button').style.display = 'inline-block';
      document.getElementById('import_post').style.display = 'inline-block';
    } else {
      document.getElementById('email').style.display = 'block';
      document.getElementById('magic_link').style.display = 'block';
      document.getElementById('send_magic_link').style.display = 'block';
      document.getElementById('submit_magic_link').style.display = 'block';
      document.getElementById('prelogin').style.display = 'block';
      
      document.getElementById('write_post_button').style.display = 'none';
      document.getElementById('import_post').style.display = 'none';
    }
  };




function sendMagicLink(email) {
  var apiUrl = "https://api.myriad.social/authentication/otp/email";
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "email": email,
      "callbackURL": "https://app.myriad.social/login"
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
    displayUserFeedback('Magic link has been successfully sent to your email. Please copy that magic link from your email and come back here to paste it!');
  })
  .catch((error) => {
    console.error('Error:', error);
    displayUserFeedback('There was an error sending the magic link. Please try again.', false);
  });
}


function authenticate(magicLink) {
  var callbackUrl = "https://app.myriad.social/login";
  var token = magicLink.replace(callbackUrl+"?token=", "");
  
  var apiUrl = "https://api.myriad.social/authentication/login/otp";

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "token": token
    })
  }).then(response => response.json())
    .then(data => {
      var accessToken = data.token.accessToken;
      var username = data.user.username;
      
      // store accessToken and username in local storage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("username", username);
      displayUserFeedback('Access Token and Username are set in local storage');
      checkLogin(); 
      document.getElementById('import_post').style.visibility = 'visible';
      var preloginElement = document.getElementById('prelogin');
      if (preloginElement) {
        preloginElement.innerText = "Logged in as: " + username;
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      displayUserFeedback('There was an error during authentication. Please try again.', false);
    });
}



function importTwitterPost(twitterUrl, selectedTimelineIds = []) {
  // retrieve access token and username from local storage
  var at = localStorage.getItem("accessToken");
var un = localStorage.getItem("username");

    
    var apiUrl = "https://api.myriad.social/user/posts/import";
    var headers = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + at,
    };

    var data = {
      "url": twitterUrl,
      "importer": un,
      "selectedTimelineIds": selectedTimelineIds,
    };

fetch(apiUrl, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
})
.then(data => {
  console.log(data);
  displayUserFeedback('The post has been successfully imported.');
})
.catch((error) => {
  console.error('Error:', error);
  displayUserFeedback('There was an error during the import. Please try again.', false);
});

  };


document.addEventListener('DOMContentLoaded', checkLogin);

