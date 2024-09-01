from flask import render_template, url_for, flash, redirect, request, Blueprint
from flask_login import login_user, current_user, logout_user, login_required

from flaskblog import db, bcrypt
from flaskblog.models import User, Post
from flaskblog.users.forms import (
    RegistrationForm,
    LoginForm,
    UpdateAccountForm,
    RequestResetForm,
    ResetPasswordForm,
)
from flaskblog.users.utils import save_picture, send_reset_email, delete_old_pic

users = Blueprint("users", __name__)


@users.route("/account", methods=["GET", "POST"])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        if form.picture.data:
            old_picture = current_user.image_file
            picture_file = save_picture(form.picture.data)
            current_user.image_file = picture_file
            delete_old_pic(old_picture)
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash("Your account has been updated!", "success")
        return redirect(url_for("users.account"))
    elif request.method == "GET":
        form.username.data = current_user.username
        form.email.data = current_user.email
    image_file = url_for("static", filename=current_user.image_file)
    return render_template(
        "account.html", title="Account", image_file=image_file, form=form
    )


@users.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode(
            "utf-8"
        )
        user = User(
            username=form.username.data, email=form.email.data, password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        flash("Your account has been created! You are now able to log in", "success")
        return redirect(url_for("users.login"))
    return render_template("register.html", title="Register", form=form)


@users.route("/admin/user/new", methods=["GET", "POST"])
@login_required
def create_user():
    # if not current_user.is_admin:  # Assuming you have a way to check admin rights
    #     flash("You do not have permission to access this page.", "danger")
    #     return redirect(url_for("main.home"))

    form = RegistrationForm()
    if form.validate_on_submit():
        if form.password.data != form.confirm_password.data:
            flash("Passwords do not match!", "danger")
        else:
            hashed_password = bcrypt.generate_password_hash(form.password.data).decode("utf-8")
            user = User(
                username=form.username.data,
                email=form.email.data,
                password=hashed_password,
                admin=form.admin.data  # Handle the admin checkbox
            )
            db.session.add(user)
            db.session.commit()
            flash(f"User {form.username.data} has been created!", "success")
            return redirect(url_for("users.admin_users"))
    else:
        # Print the errors to debug
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in the {getattr(form, field).label.text} field - {error}", "danger")
                    
    return render_template("create_user.html", title="Create User", form=form)

@users.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get("next")
            return redirect(next_page) if next_page else redirect(url_for("main.home"))
        else:
            flash("Login Unsuccessful. Please check email and password", "danger")
    return render_template("login.html", title="Login", form=form)


@users.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.home"))


@users.route("/user/<string:username>")
def user_posts(username):
    page = request.args.get("page", 1, type=int)
    user = User.query.filter_by(username=username).first_or_404()
    posts = (
        Post.query.filter_by(author=user)
        .order_by(Post.date_posted.desc())
        .paginate(page=page, per_page=5)
    )
    return render_template("user_posts.html", posts=posts, user=user)


@users.route("/reset_password", methods=["GET", "POST"])
def reset_request():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))
    form = RequestResetForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        send_reset_email(user)
        flash(
            "An email has been sent with instructions to reset your password.", "info"
        )
        return redirect(url_for("users.login"))
    return render_template("reset_request.html", title="Reset Password", form=form)


@users.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_token(token):
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))
    user = User.verify_reset_token(token)
    if not user:
        flash("That is an invalid or expired token", "warning")
        return redirect(url_for("users.reset_request"))
    form = ResetPasswordForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode(
            "utf-8"
        )
        user.password = hashed_password
        db.session.commit()
        flash("Your password has been updated! You are now able to log in.", "success")
        return redirect(url_for("users.login"))
    return render_template("reset_token.html", title="Reset Password", form=form)

@users.route("/admin/users", methods=["GET", "POST"])
@login_required
def admin_users():
    # if not current_user.is_admin:  # Assuming you have a way to check admin rights
    #     flash("You do not have permission to access this page.", "danger")
    #     return redirect(url_for("main.home"))

    users = User.query.all()
    return render_template("admin_users.html", title="Manage Users", users=users)


@users.route("/admin/user/<int:user_id>/edit", methods=["GET", "POST"])
@login_required
def edit_user(user_id):
    # if not current_user.is_admin:  # Assuming you have a way to check admin rights
    #     flash("You do not have permission to access this page.", "danger")
    #     return redirect(url_for("main.home"))

    user = User.query.get_or_404(user_id)
    form = UpdateAccountForm()

    if form.validate_on_submit():

        if form.picture.data:
            old_picture = user.image_file
            picture_file = save_picture(form.picture.data)
            user.image_file = picture_file
            delete_old_pic(old_picture)
        user.username = form.username.data
        user.email = form.email.data
        user.admin = form.admin.data
        db.session.commit()
        flash(f"{user.username}'s account has been updated!", "success")
        return redirect(url_for("users.admin_users"))

    elif request.method == "GET":
        form = UpdateAccountForm(user=user)
        form.username.data = user.username
        form.email.data = user.email

    image_file = url_for("static", filename=user.image_file)
    return render_template(
        "edit_user.html", title="Edit User", user=user, image_file=image_file, form=form
    )

@users.route("/admin/user/<int:user_id>/delete", methods=["POST"])
@login_required
def delete_user(user_id):
    # if not current_user.is_admin:  # Assuming you have a way to check admin rights
    #     flash("You do not have permission to access this page.", "danger")
    #     return redirect(url_for("main.home"))

    user = User.query.get_or_404(user_id)
    
    # Delete the user's profile picture if it exists
    if user.image_file:
        delete_old_pic(user.image_file)
    
    db.session.delete(user)
    db.session.commit()
    flash(f"User {user.username} has been deleted.", "success")
    return redirect(url_for("users.admin_users"))
