

var socket = io();
socket.on('connect', () => {
  socket.emit('type', 'login');
  var username = getCookie('username');
  var seasionKey = getCookie('seasion');
  socket.emit('seasion-info', {
    'username': username,
    'seasion': seasionKey
  });
  socket.on('queryLogin', function (data) {
    if (data.seasionStatus) {
      window.location.href = '/public/html/index.html';
    }
  })
  socket.on('login-request', (object) => {
    if (object.accountAvailability) {
      // Write username & seasionKey to cookies
      document.cookie = 'username=' + document.getElementById("username").value + ';';
      document.cookie = 'seasion=' + object.seasionKey + ';';
      // Navigate to index page
      window.location.href =  '/public/html/index.html';
    } else {
      // Display message
      var message = document.getElementById("message");
      message.textContent = "Account unavailable";
      message.style.visibility = "visible";
    }
  });
})
$(document).ready(function () {
  $(".message a").click(function () {
    $("form").animate({ height: "toggle", opacity: "toggle" }, "slow");
  });
});
function btn_login() {
  var usernameValue = document.getElementById("username").value;
  var passwordValue = document.getElementById("pass").value;
  // Check username and password validation
  if (usernameValue.length < 4) {
    message.textContent = "Username must be longer than 4 characters";
    message.style.visibility = "visible";
    return;
  }
  if (passwordValue.length < 4) {
    message.textContent = "Password must be longer than 4 characters";
    message.style.visibility = "visible";
    return;
  }
  // Emit to server
  socket.emit("login-info", {
    'username': usernameValue,
    'pass': passwordValue
  });
}
function btn_signup() {
  var usernameValue = document.getElementById("signup_user").value;
  var passwordValue = document.getElementById("signup_pass").value;
  var email = document.getElementById("signup_email").value;
  // Check username and password validation
  if (usernameValue.length < 4) {
    message.textContent = "Username must be longer than 4 characters";
    message.style.visibility = "visible";
    return;
  }
  if (passwordValue.length < 4) {
    message.textContent = "Password must be longer than 4 characters";
    message.style.visibility = "visible";
    return;
  }
  console.log(getCookie('seasion'));
  // Emit to server
  socket.emit("signup-info", {
    'username': usernameValue,
    'pass': passwordValue,
    'email': email,
    'seasion': getCookie('seasion')
  });
}

function getCookie(name) {
  var nameEQ = name + "=";
  //alert(document.cookie);
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) != -1) return c.substring(nameEQ.length, c.length);
  }
  return null;
}