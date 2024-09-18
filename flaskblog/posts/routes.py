from flask import render_template, url_for, flash, redirect, request, abort, Blueprint
from flask_login import current_user, login_required

from flaskblog import db
from flaskblog.models import Post, Comment
from flaskblog.posts.forms import PostForm, CommentForm
from flaskblog.models import Post, Comment, User

import os
import secrets
from flask import current_app
from PIL import Image

posts = Blueprint("posts", __name__)

def delete_old_pic(old_pic):
    if "default.jpg" not in old_pic:
        try:
            delete = os.path.join(str(current_app.static_folder), old_pic)
            os.remove(delete)
        except FileNotFoundError:
            pass

def save_picture(form_picture, folder='images', size=(400, 400)):
    # Define the path to the folder
    pic_path = os.path.join(current_app.static_folder, folder)

    # Create folder if it doesn't exist
    if not os.path.exists(pic_path):
        os.makedirs(pic_path)

    # Generate a random name for the image
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(pic_path, picture_fn)

    # Resize the image
    i = Image.open(form_picture)
    if i.mode == 'RGBA':
        i = i.convert('RGB')
    i.thumbnail(size)
    i.save(picture_path)

    # Return the path relative to the static folder
    return os.path.join(folder, picture_fn)

@posts.route("/post/new", methods=["GET", "POST"])
@login_required
def new_post():
    form = PostForm()
    if form.validate_on_submit():
        if form.image.data:
            image_file = save_picture(form.image.data, folder='post_images')
        else:
            image_file = None
        post = Post(title=form.title.data, content=form.content.data, author=current_user, image_file=image_file)
        db.session.add(post)
        db.session.commit()
        flash("Your post has been created!", "success")
        return redirect(url_for("main.home"))
    return render_template("create_post.html", title="New Post", form=form, legend="New Post")

@posts.route("/post/<int:post_id>", methods=["GET", "POST"])
def post(post_id):
    post = Post.query.get_or_404(post_id)
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.date_posted.asc()).all()
    form = CommentForm()

    # Preload the users for all comments to avoid querying in the template
    users = {comment.user_id: User.query.get(comment.user_id) for comment in comments}

    if form.validate_on_submit() and current_user.is_authenticated:
        if form.image.data:
            image_file = save_picture(form.image.data, folder='comment_images')
        else:
            image_file = None
        comment = Comment(content=form.content.data, post_id=post.id, user_id=current_user.id, image_file=image_file)
        db.session.add(comment)
        db.session.commit()
        flash('Your comment has been posted.', 'success')
        return redirect(url_for('posts.post', post_id=post.id))

    return render_template("post.html", title=post.title, post=post, form=form, comments=comments, users=users)

@posts.route("/post/<int:post_id>/update", methods=["GET", "POST"])
@login_required
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)
    form = PostForm()
    if form.validate_on_submit():
        if form.image.data:
            old_image = post.image_file
            image_file = save_picture(form.image.data, folder='post_images')
            post.image_file = image_file
            delete_old_pic(old_image)  # Delete the old image
        post.title = form.title.data
        post.content = form.content.data
        db.session.commit()
        flash("Your post has been updated!", "success")
        return redirect(url_for("posts.post", post_id=post.id))
    elif request.method == "GET":
        form.title.data = post.title
        form.content.data = post.content
    return render_template("create_post.html", title="Update Post", form=form, legend="Update Post")

@posts.route("/post/<int:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)
    
    # Manually delete comments associated with the post
    comments = db.relationship('Comment', backref='post', lazy=True, cascade="all, delete-orphan")
    for comment in comments:
        db.session.delete(comment)

    # Now delete the post itself
    db.session.delete(post)
    db.session.commit()
    
    flash("Your post and all associated comments have been deleted!", "success")
    return redirect(url_for("main.home"))

@posts.route("/comment/<int:comment_id>/delete", methods=["POST"])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.author != current_user and not current_user.admin:
        abort(403)
    db.session.delete(comment)
    db.session.commit()
    flash("Comment deleted", "success")
    return redirect(url_for('posts.post', post_id=comment.post_id))

@posts.route("/comment/<int:comment_id>/edit", methods=["GET", "POST"])
@login_required
def edit_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    # Ensure the user owns the comment or is an admin
    if comment.author != current_user and not current_user.admin:
        abort(403)

    form = CommentForm()
    if form.validate_on_submit():
        comment.content = form.content.data
        db.session.commit()
        flash('Your comment has been updated!', 'success')
        return redirect(url_for('posts.post', post_id=comment.post_id))
    elif request.method == 'GET':
        form.content.data = comment.content

    return render_template('edit_comment.html', title='Edit Comment', form=form)
