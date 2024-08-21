from flask import Blueprint, render_template, request, session, redirect, url_for
from .hangman import Hangman

game = Blueprint('game', __name__)

# List of words for Hangman
WORD_LIST = ['PYTHON', 'FLASK', 'HANGMAN', 'COMPUTER', 'PROGRAMMING']

@game.route('/game')
def game_home():
    return render_template('game_home.html')

@game.route('/game/set_word_length', methods=['POST'])
def set_word_length():
    word_length = int(request.form.get('word_length', 10))  # Default to 10 if not provided
    hangman = Hangman(WORD_LIST, word_length=word_length)
    session['hangman'] = hangman.to_dict()
    return redirect(url_for('game.play_game'))

@game.route('/game/start')
def start_game():
    return redirect(url_for('game.play_game'))

@game.route('/game/play', methods=['GET', 'POST'])
def play_game():
    hangman_state = session.get('hangman', None)
    
    if hangman_state is None:
        return redirect(url_for('game.start_game'))

    hangman = Hangman.from_dict(hangman_state)

    if hangman.game_over():
        return render_template('play_game.html', hangman=hangman)

    if request.method == 'POST':
        letter = request.form['letter'].upper()
        if len(letter) == 1 and letter.isalpha():
            hangman.guess(letter)
        session['hangman'] = hangman.to_dict()  # Save the state back to the session

    return render_template('play_game.html', hangman=hangman)
