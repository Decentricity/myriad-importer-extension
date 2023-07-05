function displayUserFeedback(messageText, isSuccess = true) {
  // Create a new message element
  let messageElement = document.createElement('div');

  // Add classes to the message
  messageElement.className = 'message ' + (isSuccess ? 'success' : 'error');

  // Set the text content of the message
  messageElement.textContent = messageText;

  // Append the message to the body
  document.body.appendChild(messageElement);

  // After 3 seconds, remove the message
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 6000);
}

window.onload = function() {
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            this.style.backgroundColor = '#ffd24d';
        });
    }
}


document.getElementById('send_magic_link').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  sendMagicLink(email);
});

document.getElementById('submit_magic_link').addEventListener('click', function() {
  var magicLink = document.getElementById('magic_link').value;
  authenticate(magicLink);
});

document.getElementById('import_post').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var currentUrl = tabs[0].url;
    if (currentUrl.includes('twitter.com')) {
      importTwitterPost(currentUrl);
    } else {
      console.log('Current URL is not a Twitter URL.');
    }
  });
});

function checkLogin() {
  chrome.storage.local.get(["accessToken", "username"], function(items) {
    if (items.accessToken && items.username) {
      document.getElementById('email').style.display = 'none';
      document.getElementById('magic_link').style.display = 'none';
      document.getElementById('send_magic_link').style.display = 'none';
      document.getElementById('submit_magic_link').style.display = 'none';
        
    } else {
        document.getElementById('import_post').style.visibility = 'hidden';
    }
  });
}


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
      chrome.storage.local.set({"accessToken": accessToken, "username": username}, function() {
        displayUserFeedback('Access Token and Username are set in local storage');
        checkLogin(); 
          document.getElementById('import_post').style.visibility = 'visible';
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      displayUserFeedback('There was an error during authentication. Please try again.', false);
    });
}



function importTwitterPost(twitterUrl, selectedTimelineIds = []) {
  // retrieve access token and username from local storage
  chrome.storage.local.get(["accessToken", "username"], function(items) {
    var at = items.accessToken;
    var un = items.username;
    
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
    }).then(response => response.json())
    .then(data => {
      console.log(data);
      displayUserFeedback('The Twitter post has been successfully imported.');
    })
    .catch((error) => {
      console.error('Error:', error);
      displayUserFeedback('There was an error during the import. Please try again.', false);
    });

  });
}

checkLogin();
