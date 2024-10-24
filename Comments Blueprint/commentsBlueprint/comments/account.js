// Existing PFP functionality
document.getElementById('pfpsubmit').addEventListener('click', async () => {
    const fileInput = document.getElementById('pfpinput');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('pfp', file);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/upload-pfp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    alert('Profile picture updated successfully!');
                } else {
                    alert('Failed to update profile picture: ' + result.error);
                }
            } else {
                alert('Network error: ' + response.statusText);
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Error uploading profile picture');
        }
    } else {
        alert('Please select a file to upload.');
    }
});

// Handle username change
document.getElementById('userform').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const newUsername = document.getElementById('usernameChange').value;

    try {
        const token = localStorage.getItem('token');

        const response = await fetch('/update-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ newUsername }),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Update the token with the new username
                localStorage.setItem('token', result.newToken);
                alert('Username updated successfully!');
            } else {
                alert('Failed to update username: ' + result.error);
            }
        } else {
            alert('Network error: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error updating username:', error);
        alert('Error updating username');
    }
});

// Handle password change
document.getElementById('passform').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('acccurrentpass').value;
    const newPassword = document.getElementById('changePass').value;

    try {
        const token = localStorage.getItem('token');

        const response = await fetch('/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                alert('Password updated successfully!');
            } else {
                alert('Failed to update password: ' + result.error);
            }
        } else {
            alert('Network error: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error updating password:', error);
        alert('Error updating password');
    }
});
