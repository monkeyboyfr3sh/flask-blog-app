from flask import render_template, request, Blueprint, send_from_directory, current_app
from flaskblog.models import Post
from sqlalchemy.exc import OperationalError

main = Blueprint("main", __name__)

@main.route("/")
@main.route("/home")
def home():
    page = request.args.get("page", 1, type=int)
    try:
        posts = Post.query.order_by(Post.date_posted.desc()).paginate(
            page=page, per_page=5
        )
    except OperationalError:
        posts = None
    return render_template("home.html", posts=posts)

@main.route("/about")
def about():
    return render_template("about.html", title="About")

# Add this route to serve the favicon
@main.route('/favicon.ico')
def favicon():
    return send_from_directory(current_app.static_folder, 'images/favicon.ico')
