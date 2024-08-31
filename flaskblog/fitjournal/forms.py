from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, TimeField, SubmitField
from wtforms.validators import DataRequired, NumberRange

class WorkoutLogForm(FlaskForm):
    workout_type = StringField('Workout Type', validators=[DataRequired()])
    duration = IntegerField('Duration (minutes)', validators=[DataRequired()])
    time = TimeField('Time', validators=[DataRequired()])
    rating = IntegerField('Rating (0-10)', validators=[DataRequired(), NumberRange(min=0, max=10)])
    submit = SubmitField('Submit')
