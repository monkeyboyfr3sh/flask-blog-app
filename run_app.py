import os
from flaskblog import create_app

if __name__ == "__main__":
    app = create_app()


    # ASCII Art and application information
    ascii_art = r"""
    ___      __   __  __    _  _______    _______  ______   _______  _______ 
    |   |    |  | |  ||  |  | ||   _   |  |       ||      | |       ||       |
    |   |    |  | |  ||   |_| ||  |_|  |  |    ___||  _    ||    ___||    ___|
    |   |    |  |_|  ||       ||       |  |   |___ | | |   ||   | __ |   |___ 
    |   |___ |       ||  _    ||       |  |    ___|| |_|   ||   ||  ||    ___|
    |       ||       || | |   ||   _   |  |   |___ |       ||   |_| ||   |___ 
    |_______||_______||_|  |__||__| |__|  |_______||______| |_______||_______|
       Connect, Play, and Share!
    """
    print(ascii_art)

    # Run the Flask application using the internal port
    app.run(host='0.0.0.0', debug=True)
