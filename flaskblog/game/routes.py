from flask import Blueprint, render_template, request, session, redirect, url_for
from .hangman import Hangman

game = Blueprint('game', __name__)

# List of words for Hangman
WORD_LIST = ['PYTHON', 'FLASK', 'HANGMAN', 'COMPUTER', 'PROGRAMMING']

# Initialize an in-memory scoreboard
SCOREBOARD = []

@game.route('/game')
def game_home():
    # Initialize the win counter if not already set
    if 'win_counter' not in session:
        session['win_counter'] = 0
    return render_template('game_home.html', scoreboard=SCOREBOARD)

@game.route('/game/start')
def start_game():
    hangman = Hangman(WORD_LIST)
    session['hangman'] = hangman.to_dict()
    return redirect(url_for('game.play_game'))

@game.route('/game/play', methods=['GET', 'POST'])
def play_game():
    hangman_state = session.get('hangman', None)
    
    if hangman_state is None:
        return redirect(url_for('game.start_game'))

    hangman = Hangman.from_dict(hangman_state)

    if request.method == 'POST':
        letter = request.form['letter'].upper()
        if len(letter) == 1 and letter.isalpha():
            hangman.guess(letter)
        session['hangman'] = hangman.to_dict()  # Save the state back to the session

    if hangman.game_over():
        if hangman.status == "won":
            session['win_counter'] += 1  # Increment win counter if the user wins
        else:
            session['win_counter'] = 0  # Reset win counter if the user loses
        return render_template('play_game.html', hangman=hangman)

    return render_template('play_game.html', hangman=hangman)

@game.route('/game/save_score', methods=['POST'])
def save_score():
    player_name = request.form['player_name']

    # Get wins
    wins = session['win_counter']

    # Check if the player already exists in the scoreboard
    for entry in SCOREBOARD:
        if entry['name'] == player_name:
            
            # Update entry
            if wins > entry['wins']:
                entry['wins'] = wins  # Update the existing player's score
            break
    else:
        # If the player does not exist, add a new entry
        SCOREBOARD.append({'name': player_name, 'wins': wins})

    return redirect(url_for('game.start_game'))



@game.route('/game/reset')
def reset_game():
    # Reset the game and win counter
    session.pop('hangman', None)
    session['win_counter'] = 0
    return redirect(url_for('game.start_game'))
