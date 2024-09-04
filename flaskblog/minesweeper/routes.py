from flask import render_template, Blueprint

minesweeper = Blueprint('minesweeper', __name__)

@minesweeper.route('/minesweeper')
def minesweeper_home():
    return render_template('minesweeper_home.html')