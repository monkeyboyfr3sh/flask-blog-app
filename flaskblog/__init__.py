from pathlib import Path
import shutil
from flask import Flask
from flask_login import current_user
from typing import Type
from flaskblog.config import Config
from flaskblog.extensions import db, bcrypt, login_manager, mail
import os

# Set static directory path
APP_DATA_PATH = Path.cwd().parent / "config" if Path.cwd().parent.joinpath("config").exists() else Path.cwd() / "flaskblog" / "static"
value = os.getenv("APP_STATIC_PATH", "value does not exist") 

def create_app(config_class: Type[Config] = Config) -> Flask:
    app = Flask(__name__, static_folder=APP_DATA_PATH)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)

    login_manager.login_view = "users.login"
    login_manager.login_message_category = "info"

    # Utility function to generate a user-specific session key
    def get_user_session_key(key):
        if current_user.is_authenticated:
            return f"{current_user.id}_{key}"
        return None

    @app.context_processor
    def utility_processor():
        return dict(get_user_session_key=get_user_session_key)

    # Import and register blueprints
    from flaskblog.users.routes import users
    from flaskblog.posts.routes import posts
    from flaskblog.main.routes import main
    from flaskblog.errors.handlers import errors
    from flaskblog.hangman.routes import hangman_game
    from flaskblog.fitjournal.routes import fitness
    from flaskblog.minesweeper.routes import minesweeper
    from flaskblog.jsnes_player.routes import jsnes_game

    blueprints = [users, posts, main, errors, hangman_game, fitness, minesweeper, jsnes_game]
    for blueprint in blueprints:
        app.register_blueprint(blueprint)

    # Create database tables if they don't exist
    with app.app_context():
        from flaskblog.models import create_table_if_not_exist
        create_table_if_not_exist(app)

    return app
