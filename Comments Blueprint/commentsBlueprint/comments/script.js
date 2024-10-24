document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const commentInput = document.getElementById('comment-input');
  const submitBtn = document.getElementById('submitbtn');
  const commentsSection = document.getElementById('comments-section');
  const sortBySelect = document.getElementById('sortby');

  function getUsernameFromToken() {
    if (token) {
      const jwt = token.split('.')[1];
      const payload = JSON.parse(atob(jwt));
      return payload.username;
    }
    return null;
  }



  function displayComments(comments) {
    commentsSection.innerHTML = '';
    comments.forEach(comment => {
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.dataset.commentId = comment.comment_id;
  
      const userReaction = comment.userReaction; // This should be 'like', 'dislike', or null
  
      // Determine the image source based on user reaction
      const likeImage = userReaction === 'like' ? '/images/likeactive.png' : '/images/likebtn.png';
      const dislikeImage = userReaction === 'dislike' ? '/images/dislikeactive.png' : '/images/dislikebtn.png';
  
      commentDiv.innerHTML = `
        <img src="${comment.pfp}" alt="pfp" id="pfpimagecomments">
        <div class="username">${comment.username}</div>
        <div class="comment_text">${comment.comment_text}</div>
        <div class="actions">
          <img src="${dislikeImage}" alt="dislike" class="dislike-btn" data-id="${comment.comment_id}">
          <span class="dislike-count">${comment.dislikes}</span>
          <img src="${likeImage}" alt="like" class="like-btn" data-id="${comment.comment_id}">
          <span class="like-count">${comment.likes}</span>
          <div class="show-more" data-id="${comment.comment_id}">Show more</div>
        </div>
        <div class="replies-container" id="replies-${comment.comment_id}" style="display: none;">
          <h4>Replies</h4>
          <div class="reply-form">
            <label for="reply-input-${comment.comment_id}">Reply:</label>
            <input type="text" id="reply-input-${comment.comment_id}" class="reply-input" placeholder="Enter your reply here">
            <button class="reply-btn" data-id="${comment.comment_id}">Submit Reply</button>
          </div>
          <div class="replies-list" id="replies-list-${comment.comment_id}">
            <!-- Replies will be dynamically injected here -->
          </div>
        </div>
      `;
      commentsSection.appendChild(commentDiv);
    });
  }

  function fetchComments(sortBy = 'date') {
    fetch(`/comments?sortby=${sortBy}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => displayComments(data.comments))
    .catch(error => console.error('Error fetching comments:', error));
  }

  function postComment(commentText) {
    if (commentText.length > 150) {
      alert('Comment must be 150 characters or less.');
      return;
    }

    fetch('/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment_text: commentText})
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchComments(sortBySelect.value);
        commentInput.value = '';
      } else {
        commentInput.placeholder = 'Please sign in to comment';
      }
    })
    .catch(error => console.error('Error posting comment:', error));
  }

  function postReply(commentId, replyText) {
    fetch('/replies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment_id: commentId, reply_text: replyText })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchReplies(commentId);
      }
    })
    .catch(error => console.error('Error posting reply:', error));
  }

  function fetchReplies(commentId) {
    fetch(`/replies?comment_id=${commentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const repliesList = document.getElementById(`replies-list-${commentId}`);
      repliesList.innerHTML = '';
      data.replies.forEach(reply => {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply';
  
        const userReaction = reply.userReaction; // This should be 'like', 'dislike', or null
  
        // Determine the image source based on user reaction
        const likeImage = userReaction === 'like' ? '/images/likeactive.png' : '/images/likebtn.png';
        const dislikeImage = userReaction === 'dislike' ? '/images/dislikeactive.png' : '/images/dislikebtn.png';
  
        replyDiv.innerHTML = `
          <img src="${reply.pfp}" alt="pfp" id="replypfp" class="replypfp">
          <div class="reply-username">${reply.username}</div>
          <div class="reply-text">${reply.reply_text}</div>
          <div class="actions">
            <img src="${dislikeImage}" alt="dislike" class="dislike-btn-reply" id="dislike-btn-reply" data-id="${reply.reply_id}">
            <span class="dislike-count" id="replydislikespan">${reply.dislikes}</span>
            <img src="${likeImage}" alt="like" class="like-btn-reply" id="like-btn-reply" data-id="${reply.reply_id}">
            <span class="like-count">${reply.likes}</span>
          </div>
        `;
        repliesList.appendChild(replyDiv);
      });
    })
    .catch(error => console.error('Error fetching replies:', error));
  }

  function handleReaction(commentId, reactionType) {
    fetch(`/comments/${commentId}/${reactionType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        fetchComments(sortBySelect.value); // Refresh comments to update like/dislike buttons
      }
    })
    .catch(error => console.error(`Error ${reactionType} comment:`, error));
  }

  function handleReplyReaction(replyId, reactionType) {
    fetch(`/replies/${replyId}/${reactionType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update the replies list for the parent comment
        const replyDiv = document.querySelector(`.reply [data-id="${replyId}"]`);
        if (replyDiv) {
          const commentId = replyDiv.closest('.replies-container').id.split('-')[1];
          fetchReplies(commentId);
        }
      }
    })
    .catch(error => console.error(`Error ${reactionType} reply:`, error));
  }

  submitBtn.addEventListener('click', () => {
    const username = getUsernameFromToken();
    if (username) {
      postComment(commentInput.value);
    } else {
      commentInput.placeholder = 'Please sign in to comment';
    }
  });

  sortBySelect.addEventListener('change', () => {
    fetchComments(sortBySelect.value);
  });

  commentsSection.addEventListener('click', event => {
    const { target } = event;
    const commentId = target.dataset.id;

    if (target.classList.contains('like-btn')) {
      handleReaction(commentId, 'like');
    } else if (target.classList.contains('dislike-btn')) {
      handleReaction(commentId, 'dislike');
    } else if (target.classList.contains('show-more')) {
      const repliesContainer = document.getElementById(`replies-${commentId}`);
      if (repliesContainer.style.display === 'none') {
        repliesContainer.style.display = 'block';
        target.textContent = 'Show less';
        fetchReplies(commentId);
      } else {
        repliesContainer.style.display = 'none';
        target.textContent = 'Show more';
      }
    } else if (target.classList.contains('reply-btn')) {
      const replyInput = document.getElementById(`reply-input-${commentId}`);
      postReply(commentId, replyInput.value);
      replyInput.value = '';
    } else if (target.classList.contains('like-btn-reply')) {
      handleReplyReaction(target.dataset.id, 'like');
    } else if (target.classList.contains('dislike-btn-reply')) {
      handleReplyReaction(target.dataset.id, 'dislike');
    }
  });

  fetchComments(); // Initial fetch
});
