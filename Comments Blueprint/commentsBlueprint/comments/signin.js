document.addEventListener('DOMContentLoaded', function() {
  const signinForm = document.getElementById('signinForm');

  signinForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Save JWT token to localStorage
        localStorage.setItem('token', data.token);
        alert('User logged in successfully');
        window.location.href = '/home';
      } else {
        alert('Login failed. Please check your credentials.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    });
  });
});
