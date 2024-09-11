from flask import render_template, request, jsonify, Blueprint
from flask_login import login_required, current_user
from flaskblog.models import NESState, db

jsnes_game = Blueprint('jsnes_game', __name__)

@jsnes_game.route('/jsnes')
@login_required
def jsnes_home():
    return render_template('jsnes_home.html', title="JSNES Emulator")


@jsnes_game.route('/save_state', methods=['POST'])
@login_required
def save_state():
    state_data = request.json.get('stateData')
    if not state_data:
        return jsonify({'error': 'No state data provided'}), 400

    new_save = NESState(
        user_id=current_user.id,
        state_data=state_data
    )
    
    db.session.add(new_save)
    db.session.commit()
    
    return jsonify({'message': 'State saved successfully', 'save_date': new_save.save_date.isoformat()}), 201


@jsnes_game.route('/load_states', methods=['GET'])
@login_required
def load_states():
    saved_states = NESState.query.filter_by(user_id=current_user.id).all()
    state_list = [{'id': state.id, 'save_date': state.save_date.isoformat()} for state in saved_states]
    
    return jsonify(state_list)
    
@jsnes_game.route('/load_state/<int:state_id>', methods=['GET'])
@login_required
def load_state(state_id):
    save = NESState.query.filter_by(id=state_id, user_id=current_user.id).first()
    if save:
        return jsonify({'stateData': save.state_data})
    return jsonify({'error': 'Save state not found'}), 404
