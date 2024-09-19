function likePost(postId) {
    const likeCountElem = document.getElementById(`like-count-${postId}`);
    const dislikeCountElem = document.getElementById(`dislike-count-${postId}`);
    const likeButton = document.getElementById(`like-btn-${postId}`);
    const dislikeButton = document.getElementById(`dislike-btn-${postId}`);

    // Optimistically update the UI
    const previousLikeState = likeButton.classList.contains('btn-success');
    const previousDislikeState = dislikeButton.classList.contains('btn-danger');
    const currentLikes = parseInt(likeCountElem.innerText);
    const currentDislikes = parseInt(dislikeCountElem.innerText);

    // Immediate UI change assuming success
    if (previousLikeState) {
        likeButton.classList.remove('btn-success');
        likeButton.classList.add('btn-outline-success');
        likeCountElem.innerText = currentLikes - 1;
    } else {
        likeButton.classList.remove('btn-outline-success');
        likeButton.classList.add('btn-success');
        likeCountElem.innerText = currentLikes + 1;
        if (previousDislikeState) {
            dislikeButton.classList.remove('btn-danger');
            dislikeButton.classList.add('btn-outline-danger');
            dislikeCountElem.innerText = currentDislikes - 1;
        }
    }

    // Make the fetch request to the server
    fetch(`/post/${postId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Server response: update the like and dislike counts from the server
        likeCountElem.innerText = data.likes;
        dislikeCountElem.innerText = data.dislikes;
    })
    .catch(error => {
        // Revert the UI if there's an error
        console.error('Error:', error);
        alert('Something went wrong while liking the post.');

        // Revert the like/dislike buttons and counts back to their previous states
        if (previousLikeState) {
            likeButton.classList.remove('btn-outline-success');
            likeButton.classList.add('btn-success');
            likeCountElem.innerText = currentLikes;
        } else {
            likeButton.classList.remove('btn-success');
            likeButton.classList.add('btn-outline-success');
            likeCountElem.innerText = currentLikes;
        }

        if (previousDislikeState) {
            dislikeButton.classList.remove('btn-outline-danger');
            dislikeButton.classList.add('btn-danger');
            dislikeCountElem.innerText = currentDislikes;
        }
    });
}

function dislikePost(postId) {
    const likeCountElem = document.getElementById(`like-count-${postId}`);
    const dislikeCountElem = document.getElementById(`dislike-count-${postId}`);
    const likeButton = document.getElementById(`like-btn-${postId}`);
    const dislikeButton = document.getElementById(`dislike-btn-${postId}`);

    // Optimistically update the UI
    const previousLikeState = likeButton.classList.contains('btn-success');
    const previousDislikeState = dislikeButton.classList.contains('btn-danger');
    const currentLikes = parseInt(likeCountElem.innerText);
    const currentDislikes = parseInt(dislikeCountElem.innerText);

    // Immediate UI change assuming success
    if (previousDislikeState) {
        dislikeButton.classList.remove('btn-danger');
        dislikeButton.classList.add('btn-outline-danger');
        dislikeCountElem.innerText = currentDislikes - 1;
    } else {
        dislikeButton.classList.remove('btn-outline-danger');
        dislikeButton.classList.add('btn-danger');
        dislikeCountElem.innerText = currentDislikes + 1;
        if (previousLikeState) {
            likeButton.classList.remove('btn-success');
            likeButton.classList.add('btn-outline-success');
            likeCountElem.innerText = currentLikes - 1;
        }
    }

    // Make the fetch request to the server
    fetch(`/post/${postId}/dislike`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Server response: update the like and dislike counts from the server
        likeCountElem.innerText = data.likes;
        dislikeCountElem.innerText = data.dislikes;
    })
    .catch(error => {
        // Revert the UI if there's an error
        console.error('Error:', error);
        alert('Something went wrong while disliking the post.');

        // Revert the like/dislike buttons and counts back to their previous states
        if (previousDislikeState) {
            dislikeButton.classList.remove('btn-outline-danger');
            dislikeButton.classList.add('btn-danger');
            dislikeCountElem.innerText = currentDislikes;
        } else {
            dislikeButton.classList.remove('btn-danger');
            dislikeButton.classList.add('btn-outline-danger');
            dislikeCountElem.innerText = currentDislikes;
        }

        if (previousLikeState) {
            likeButton.classList.remove('btn-outline-success');
            likeButton.classList.add('btn-success');
            likeCountElem.innerText = currentLikes;
        }
    });
}

function likeComment(commentId) {
    const likeCountElem = document.getElementById(`like-count-comment-${commentId}`);
    const dislikeCountElem = document.getElementById(`dislike-count-comment-${commentId}`);
    const likeButton = document.getElementById(`like-btn-comment-${commentId}`);
    const dislikeButton = document.getElementById(`dislike-btn-comment-${commentId}`);

    const previousLikeState = likeButton.classList.contains('btn-success');
    const previousDislikeState = dislikeButton.classList.contains('btn-danger');
    const currentLikes = parseInt(likeCountElem.innerText);
    const currentDislikes = parseInt(dislikeCountElem.innerText);

    if (previousLikeState) {
        likeButton.classList.remove('btn-success');
        likeButton.classList.add('btn-outline-success');
        likeCountElem.innerText = currentLikes - 1;
    } else {
        likeButton.classList.remove('btn-outline-success');
        likeButton.classList.add('btn-success');
        likeCountElem.innerText = currentLikes + 1;
        if (previousDislikeState) {
            dislikeButton.classList.remove('btn-danger');
            dislikeButton.classList.add('btn-outline-danger');
            dislikeCountElem.innerText = currentDislikes - 1;
        }
    }

    fetch(`/comment/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        likeCountElem.innerText = data.likes;
        dislikeCountElem.innerText = data.dislikes;
    })
    .catch(error => console.error('Error:', error));
}

function dislikeComment(commentId) {
    const likeCountElem = document.getElementById(`like-count-comment-${commentId}`);
    const dislikeCountElem = document.getElementById(`dislike-count-comment-${commentId}`);
    const likeButton = document.getElementById(`like-btn-comment-${commentId}`);
    const dislikeButton = document.getElementById(`dislike-btn-comment-${commentId}`);

    const previousLikeState = likeButton.classList.contains('btn-success');
    const previousDislikeState = dislikeButton.classList.contains('btn-danger');
    const currentLikes = parseInt(likeCountElem.innerText);
    const currentDislikes = parseInt(dislikeCountElem.innerText);

    if (previousDislikeState) {
        dislikeButton.classList.remove('btn-danger');
        dislikeButton.classList.add('btn-outline-danger');
        dislikeCountElem.innerText = currentDislikes - 1;
    } else {
        dislikeButton.classList.remove('btn-outline-danger');
        dislikeButton.classList.add('btn-danger');
        dislikeCountElem.innerText = currentDislikes + 1;
        if (previousLikeState) {
            likeButton.classList.remove('btn-success');
            likeButton.classList.add('btn-outline-success');
            likeCountElem.innerText = currentLikes - 1;
        }
    }

    fetch(`/comment/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        likeCountElem.innerText = data.likes;
        dislikeCountElem.innerText = data.dislikes;
    })
    .catch(error => console.error('Error:', error));
}
