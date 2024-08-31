from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import HangmanScore
from datetime import datetime
from .hangman import Hangman

hangman_game = Blueprint('hangman', __name__)

# List of words for Hangman
WORD_LIST = ['PYTHON', 'FLASK', 'HANGMAN', 'COMPUTER', 'PROGRAMMING']

def get_user_session_key(key):
    return f"{current_user.id}_{key}"

@hangman_game.route('/hangman')
@login_required
def game_home():
    # Initialize or retrieve the user's score from the database
    user_score = HangmanScore.query.filter_by(user_id=current_user.id).first()
    if not user_score:
        user_score = HangmanScore(user_id=current_user.id)
        db.session.add(user_score)
        db.session.commit()

    session[get_user_session_key('win_counter')] = user_score.wins

    # Get the scoreboard with all users' scores
    scoreboard = HangmanScore.query.order_by(HangmanScore.wins.desc()).all()
    
    return render_template('hangman_home.html', scoreboard=scoreboard)

@hangman_game.route('/hangman/start')
@login_required
def start_game():
    hangman = Hangman(WORD_LIST)
    session[get_user_session_key('hangman')] = hangman.to_dict()
    return redirect(url_for('hangman.play_game'))

@hangman_game.route('/hangman/play', methods=['GET', 'POST'])
@login_required
def play_game():
    hangman_state = session.get(get_user_session_key('hangman'), None)
    
    if hangman_state is None:
        return redirect(url_for('hangman.start_game'))

    hangman = Hangman.from_dict(hangman_state)

    if request.method == 'POST':
        guess = request.form.get('guess', '').strip().upper()
        if guess and guess.isalpha():
            hangman.guess(guess)
        session[get_user_session_key('hangman')] = hangman.to_dict()

    if hangman.game_over():
        if hangman.status == "won":
            session[get_user_session_key('win_counter')] += 1
        elif hangman.status == "lost":
            session[get_user_session_key('win_counter')] = 0  # Reset win counter on loss
        return render_template('hangman_play_game.html', hangman=hangman, allow_save=True)

    return render_template('hangman_play_game.html', hangman=hangman)

@hangman_game.route('/hangman/save_score', methods=['POST'])
@login_required
def save_score():
    # Update or create the user's score in the database
    user_score = HangmanScore.query.filter_by(user_id=current_user.id).first()
    if user_score:
        user_score.wins = session[get_user_session_key('win_counter')]
        user_score.date_updated = datetime.utcnow()
    else:
        user_score = HangmanScore(user_id=current_user.id, wins=session[get_user_session_key('win_counter')])
        db.session.add(user_score)
    db.session.commit()

    hangman_state = session.get(get_user_session_key('hangman'), None)
    
    if hangman_state is None:
        return redirect(url_for('hangman.start_game'))

    hangman = Hangman.from_dict(hangman_state)

    if hangman.status == "lost":
        session[get_user_session_key('win_counter')] = 0

    return redirect(url_for('hangman.start_game'))

@hangman_game.route('/hangman/reset')
@login_required
def reset_game():
    # Allow player to save score before resetting
    if get_user_session_key('hangman') in session:
        hangman = Hangman.from_dict(session[get_user_session_key('hangman')])
        if hangman.game_over() and hangman.status == "lost":
            return redirect(url_for('hangman.play_game'))

    # Reset the game and win counter
    session.pop(get_user_session_key('hangman'), None)
    session[get_user_session_key('win_counter')] = 0

    # Reset the user's win counter in the database
    user_score = HangmanScore.query.filter_by(user_id=current_user.id).first()
    if user_score:
        user_score.wins = 0
        db.session.commit()

    return redirect(url_for('hangman.start_game'))
