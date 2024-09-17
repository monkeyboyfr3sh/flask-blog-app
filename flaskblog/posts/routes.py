from flask import render_template, url_for, flash, redirect, request, abort, Blueprint
from flask_login import current_user, login_required

from flaskblog import db
from flaskblog.models import Post, Comment
from flaskblog.posts.forms import PostForm, CommentForm

posts = Blueprint("posts", __name__)


@posts.route("/post/new", methods=["GET", "POST"])
@login_required
def new_post():
    form = PostForm()
    if form.validate_on_submit():
        post = Post(
            title=form.title.data, content=form.content.data, author=current_user
        )
        db.session.add(post)
        db.session.commit()
        flash("Your post has been created!", "success")
        return redirect(url_for("main.home"))
    return render_template(
        "create_post.html", title="New Post", form=form, legend="New Post"
    )


@posts.route("/post/<int:post_id>", methods=["GET", "POST"])
def post(post_id):
    post = Post.query.get_or_404(post_id)
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.date_posted.desc()).all()  # Fetch comments
    form = CommentForm()

    if form.validate_on_submit() and current_user.is_authenticated:
        comment = Comment(content=form.content.data, post_id=post.id, user_id=current_user.id)
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
    db.session.delete(post)
    db.session.commit()
    flash("Your post has been deleted!", "success")
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
