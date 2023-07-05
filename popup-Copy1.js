document.getElementById('send_magic_link').addEventListener('click', function() {
  var email = document.getElementById('email').value;
  sendMagicLink(email);
});

document.getElementById('submit_magic_link').addEventListener('click', function() {
  var magicLink = document.getElementById('magic_link').value;
  authenticate(magicLink);
});

document.getElementById('import_post').addEventListener('click', function() {
  var twitterUrl = document.getElementById('twitter_url').value;
  
  importTwitterPost(twitterUrl);
});



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
  }).then(response => response.json())
    .then(data => console.log(data))
    .catch((error) => {
      console.error('Error:', error);
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
        console.log('Access Token and Username are set in local storage');
      });
    })
    .catch((error) => {
      console.error('Error:', error);
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
      .then(data => console.log(data))
      .catch((error) => {
        console.error('Error:', error);
      });
  });
}
