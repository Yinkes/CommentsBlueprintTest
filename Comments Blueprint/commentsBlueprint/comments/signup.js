  document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const repassword = document.getElementById('repassword').value;

    if (password !== repassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        // Save JWT token to localStorage
        localStorage.setItem('token', data.token);
        alert('Signed up successfully!');
        window.location.href = '/home';
      } else {
        alert('Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Error signing up:', error);
    }
  });
