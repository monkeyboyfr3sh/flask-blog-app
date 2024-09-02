from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import HangmanScore
from datetime import datetime
from .hangman import Hangman
import random

hangman_game = Blueprint('hangman', __name__)

# Define word lists for each category
WORD_LISTS = {
    'space': [
        'ASTEROID', 'COMET', 'GALAXY', 'NEBULA', 'PLANET', 'QUASAR', 
        'SUPERNOVA', 'TELESCOPE', 'ORBIT', 'ASTRONAUT', 'BLACKHOLE', 
        'CONSTELLATION', 'GRAVITY', 'INTERSTELLAR', 'ROCKET', 'SATELLITE'
    ],
    'fun_math': [
        'FRACTION', 'ALGEBRA', 'CALCULUS', 'GEOMETRY', 'TRIGONOMETRY', 
        'EQUATION', 'MATRIX', 'INTEGRAL', 'DERIVATIVE', 'LOGARITHM', 
        'PARALLELOGRAM', 'POLYNOMIAL', 'PYTHAGORAS', 'TANGENT', 'COSINE', 
        'PROBABILITY'
    ],
    'philosophers': [
        'PLATO', 'ARISTOTLE', 'DESCARTES', 'KANT', 'HEGEL', 'NIETZSCHE', 
        'WITTGENSTEIN', 'AQUINAS', 'HUME', 'SPINOZA', 'LOCKE', 
        'RUSSELL', 'SARTRE', 'FREGE', 'AUGUSTINE'
    ],
    'authors': [
        'SHAKESPEARE', 'DOSTOEVSKY', 'TOLSTOY', 'ORWELL', 'AUSTEN', 
        'HEMINGWAY', 'JOYCE', 'DICKENS', 'FAULKNER', 'FROST', 
        'WOOLF', 'HOMER', 'CERVANTES', 'CHAUCER', 'MILTON'
    ],
    'video_games': [
        'MINECRAFT', 'FORTNITE', 'OVERWATCH', 'CYBERPUNK', 'GODOFWAR', 
        'REDDEAD', 'WITCHER', 'APEXLEGENDS', 'AMONGUS', 'FALLOUT', 
        'LEAGUEOFLEGENDS', 'VALORANT', 'ELDENRING', 'HORIZON', 'FIFA'
    ]
}

def get_user_session_key(key):
    return f"{current_user.id}_{key}"

def select_new_word(category):
    used_words = session.get(get_user_session_key('used_words'), [])
    word_list = WORD_LISTS.get(category, WORD_LISTS['space'])  # Default to space if invalid category
    while True:
        selected_word = random.choice(word_list)
        if selected_word not in used_words:
            break
    
    # Update the FIFO queue of used words
    used_words.append(selected_word)
    if len(used_words) > 3:
        used_words.pop(0)  # Remove the oldest word if more than 3 words are stored
    session[get_user_session_key('used_words')] = used_words

    return selected_word

@hangman_game.route('/hangman')
@login_required
def game_home():
    # Reset the session win counter on page load to track the current session's wins
    session[get_user_session_key('win_counter')] = 0

    # Get the scoreboard with all users' scores
    scoreboard = HangmanScore.query.order_by(HangmanScore.wins.desc()).all()
    
    return render_template('hangman_home.html', scoreboard=scoreboard)

@hangman_game.route('/hangman/start')
@login_required
def start_game():
    category = request.args.get('category', 'space')  # Default to 'space' if no category is selected
    word = select_new_word(category)
    hangman = Hangman(word)
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
            # Don't reset the win counter immediately; allow the user to save it first
            return render_template('hangman_play_game.html', hangman=hangman, allow_save=True)

    return render_template('hangman_play_game.html', hangman=hangman)

@hangman_game.route('/hangman/save_score', methods=['POST'])
@login_required
def save_score():
    # Only save the max number of wins from this session
    session_wins = session.get(get_user_session_key('win_counter'), 0)
    
    user_score = HangmanScore.query.filter_by(user_id=current_user.id).first()
    if user_score:
        if session_wins > user_score.wins:
            user_score.wins = session_wins  # Update with max session wins only if it's higher
        user_score.date_updated = datetime.utcnow()
    else:
        user_score = HangmanScore(user_id=current_user.id, wins=session_wins)
        db.session.add(user_score)
    db.session.commit()

    hangman_state = session.get(get_user_session_key('hangman'), None)
    
    if hangman_state is None:
        return redirect(url_for('hangman.start_game'))

    # After saving, redirect to the hangman home page or any other appropriate page
    return redirect(url_for('hangman.start_game'))

@hangman_game.route('/hangman/select_category')
@login_required
def select_category():
    categories = WORD_LISTS.keys()  # Get the list of available categories
    return render_template('select_category.html', categories=categories)

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

    return redirect(url_for('hangman.start_game'))

@hangman_game.route('/hangman/clear_scoreboard', methods=['POST'])
@login_required
def clear_scoreboard():
    # Delete all entries in the HangmanScore table
    HangmanScore.query.delete()
    db.session.commit()
    flash('All entries in the scoreboard have been deleted.', 'success')
    return redirect(url_for('hangman.game_home'))
