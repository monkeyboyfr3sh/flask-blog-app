from flask import render_template, Blueprint

# Create a new blueprint for the JSNES emulator
jsnes_game = Blueprint('jsnes_game', __name__)

@jsnes_game.route('/jsnes')
def jsnes_home():
    return render_template('jsnes_home.html', title="JSNES Emulator")
