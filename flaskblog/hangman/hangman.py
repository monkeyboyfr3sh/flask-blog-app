import random

HANGMAN_PICS = [
    '''
      +---+
      |   |
          |
          |
          |
          |
    =========''', '''
      +---+
      |   |
      O   |
          |
          |
          |
    =========''', '''
      +---+
      |   |
      O   |
      |   |
          |
          |
    =========''', '''
      +---+
      |   |
      O   |
     /|   |
          |
          |
    =========''', '''
      +---+
      |   |
      O   |
     /|\\  |
          |
          |
    =========''', '''
      +---+
      |   |
      O   |
     /|\\  |
     /    |
          |
    =========''', '''
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    ========='''
]

DEATH_ANIMATION = [
    '''
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    =========''',  # Final hangman frame
    '''
          
          
          
          
          
          
          
    =========''',  # Blank frame
    '''
          
          
          
     _______
    |       |
    |  R.I.P|
    |_______|
          
          
    ========='''  # Tombstone frame
]

class Hangman:
    def __init__(self, word=None, guesses=None, remaining_attempts=6):
        self.word = word.upper()
        self.guesses = set(guesses) if guesses else set()
        self.remaining_attempts = remaining_attempts
        self.status = "ongoing"
        self.death_animation = DEATH_ANIMATION  # Initialize the death animation list

    def guess(self, guess):
        guess = guess.upper()
        
        if guess in self.guesses:
            return False  # Guess was already made
        self.guesses.add(guess)
        
        if len(guess) == 1:  # Single letter guess
            if guess not in self.word:
                self.remaining_attempts -= 1
        elif len(guess) > 1:  # Multiple letters guessed (word guess)
            if guess == self.word:
                self.status = "won"
                return True
            else:
                self.remaining_attempts = 0  # Instant fail on incorrect word guess
                self.status = "lost"
                return False

        if self.remaining_attempts <= 0:
            self.status = "lost"
        elif all(letter in self.guesses for letter in self.word):
            self.status = "won"

        return True

    def display_word(self):
        if self.status == "won":
            return self.word
        else:
            return " ".join([letter if letter in self.guesses else "_" for letter in self.word])

    def game_over(self):
        return self.status in ["won", "lost"]

    def to_dict(self):
        return {
            'word': self.word,
            'guesses': list(self.guesses),
            'remaining_attempts': self.remaining_attempts,
        }

    def display_hangman(self):
        return HANGMAN_PICS[len(HANGMAN_PICS) - self.remaining_attempts - 1]

    def get_death_animation(self):
        return {
            'frames': self.death_animation,
            'playback_rate': 500  # Playback rate in milliseconds
        }

    @classmethod
    def from_dict(cls, state):
        return cls(
            word=state['word'],
            guesses=state['guesses'],
            remaining_attempts=state['remaining_attempts']
        )
