from flask import render_template, url_for, flash, redirect, request, abort, Blueprint
from flask_login import current_user, login_required

from flaskblog import db
from flaskblog.models import Post, Comment
from flaskblog.posts.forms import PostForm, CommentForm

import os
import secrets
from flask import current_app
from PIL import Image

posts = Blueprint("posts", __name__)

def save_image(form_image):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_image.filename)
    image_fn = random_hex + f_ext
    image_path = os.path.join(current_app.root_path, 'static/post_images', image_fn)

    # Resize the image (optional)
    i = Image.open(form_image)
    i.thumbnail((400, 400))  # Resize to a maximum of 400x400 pixels
    i.save(image_path)

    return image_fn

@posts.route("/post/new", methods=["GET", "POST"])
@login_required
def new_post():
    form = PostForm()
    if form.validate_on_submit():
        if form.image.data:
            image_file = save_image(form.image.data)
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

    if form.validate_on_submit() and current_user.is_authenticated:
        if form.image.data:
            image_file = save_image(form.image.data)
        else:
            image_file = None
        comment = Comment(content=form.content.data, post_id=post.id, user_id=current_user.id, image_file=image_file)
        db.session.add(comment)
        db.session.commit()
        flash('Your comment has been posted.', 'success')
        return redirect(url_for('posts.post', post_id=post.id))

    return render_template("post.html", title=post.title, post=post, form=form, comments=comments)

@posts.route("/post/<int:post_id>/update", methods=["GET", "POST"])
@login_required
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author != current_user:
        abort(403)
    form = PostForm()
    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        db.session.commit()
        flash("Your post has been updated!", "success")
        return redirect(url_for("posts.post", post_id=post.id))
    elif request.method == "GET":
        form.title.data = post.title
        form.content.data = post.content
    return render_template(
        "create_post.html", title="Update Post", form=form, legend="Update Post"
    )


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
