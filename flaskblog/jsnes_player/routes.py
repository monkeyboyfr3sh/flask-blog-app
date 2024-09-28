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
    screenshot = request.json.get('screenshot')
    title = request.json.get('title')  # Get the title (filename of the ROM)

    # Ensure that state data, screenshot, and title are provided and valid
    if not state_data or not screenshot or not title or len(screenshot) < 50:  # Screenshots should not be too small
        return jsonify({'error': 'Invalid state data, screenshot, or title provided'}), 400

    new_save = NESState(
        user_id=current_user.id,
        state_data=state_data,
        screenshot=screenshot,
        title=title  # Store the ROM title
    )

    db.session.add(new_save)
    db.session.commit()

    return jsonify({
        'message': 'State saved successfully',
        'save_date': new_save.save_date.isoformat(),
        'title': new_save.title  # Return the title in the response
    }), 201

@jsnes_game.route('/load_states', methods=['GET'])
@login_required
def load_states():
    saved_states = NESState.query.filter_by(user_id=current_user.id).all()
    state_list = [{'id': state.id, 'save_date': state.save_date.isoformat(), 'screenshot': state.screenshot, 'title': state.title} for state in saved_states]
    
    return jsonify(state_list)
    
@jsnes_game.route('/load_state/<int:state_id>', methods=['GET'])
@login_required
def load_state(state_id):
    save = NESState.query.filter_by(id=state_id, user_id=current_user.id).first()
    if save:
        return jsonify({'stateData': save.state_data})
    return jsonify({'error': 'Save state not found'}), 404


@jsnes_game.route('/delete_state/<int:state_id>', methods=['DELETE'])
@login_required
def delete_state(state_id):
    save_state = NESState.query.filter_by(id=state_id, user_id=current_user.id).first()
    if save_state:
        db.session.delete(save_state)
        db.session.commit()
        return jsonify({'message': 'State deleted successfully'}), 200
    return jsonify({'error': 'State not found'}), 404


@jsnes_game.route('/clear_states', methods=['DELETE'])
@login_required
def clear_states():
    NESState.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'message': 'All states cleared successfully'}), 200
