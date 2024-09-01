from flask import render_template, url_for, flash, redirect, request, Blueprint, abort
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import WorkoutLog
from flaskblog.fitjournal.forms import WorkoutLogForm

fitness = Blueprint("fitness", __name__)

@fitness.route("/fitness/journal")
@login_required
def journal_home():
    logs = WorkoutLog.query.filter_by(author=current_user).all()
    return render_template('fitjournal_home.html', logs=logs)

@fitness.route("/fitness/log/new", methods=["GET", "POST"])
@login_required
def new_log():
    form = WorkoutLogForm()
    if form.validate_on_submit():
        log = WorkoutLog(
            workout_type=form.workout_type.data,
            duration=form.duration.data,
            time=form.time.data,
            rating=form.rating.data,
            notes=form.notes.data,  # **Handle Notes**
            author=current_user,
        )
        db.session.add(log)
        db.session.commit()
        flash("Your workout log has been created!", "success")
        return redirect(url_for("fitness.journal_home"))
    return render_template(
        "fitjournal_add_entry.html", title="New Workout Log", form=form, legend="New Workout Log"
    )

@fitness.route("/fitness/log/<int:log_id>")
def log(log_id):
    log = WorkoutLog.query.get_or_404(log_id)
    return render_template("fitjournal_log.html", title=log.workout_type, log=log)

@fitness.route("/fitness/log/<int:log_id>/update", methods=["GET", "POST"])
@login_required
def update_log(log_id):
    log = WorkoutLog.query.get_or_404(log_id)
    if log.author != current_user:
        abort(403)
    form = WorkoutLogForm()
    if form.validate_on_submit():
        # Optionally delete old log if you want to replace it entirely
        db.session.delete(log)
        db.session.commit()

        log.workout_type = form.workout_type.data
        log.duration = form.duration.data
        log.time = form.time.data
        log.rating = form.rating.data
        log.notes = form.notes.data  # **Handle Notes**
        db.session.commit()  # Save the updated log
        flash("Your workout log has been updated!", "success")
        return redirect(url_for("fitness.log", log_id=log.id))
    elif request.method == "GET":
        # Populate the form with the current log data
        form.workout_type.data = log.workout_type
        form.duration.data = log.duration
        form.time.data = log.time
        form.rating.data = log.rating
        form.notes.data = log.notes  # **Populate Notes Field**
    return render_template(
        "fitjournal_add_entry.html", title="Update Workout Log", form=form, legend="Update Workout Log"
    )


@fitness.route("/fitness/log/<int:log_id>/delete", methods=["POST"])
@login_required
def delete_log(log_id):
    log = WorkoutLog.query.get_or_404(log_id)
    if log.author != current_user:
        abort(403)
    db.session.delete(log)
    db.session.commit()
    flash("Your workout log has been deleted!", "success")
    return redirect(url_for("fitness.journal_home"))
