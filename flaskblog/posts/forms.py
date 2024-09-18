from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField, FileField
from wtforms.validators import DataRequired
from flask_wtf.file import FileAllowed

class PostForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired()])
    content = TextAreaField("Content", validators=[DataRequired()])
    image = FileField("Attach Image", validators=[FileAllowed(['jpg', 'png', 'jpeg'])])
    submit = SubmitField("Post")

class CommentForm(FlaskForm):
    content = TextAreaField('Comment', validators=[DataRequired()])
    image = FileField("Attach Image", validators=[FileAllowed(['jpg', 'png', 'jpeg'])])
    submit = SubmitField('Post Comment')