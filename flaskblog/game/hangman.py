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

class Hangman:
    def __init__(self, word_list, word=None, guesses=None, remaining_attempts=6, word_length=0):
        self.word_list = [w for w in word_list if len(w) == word_length]
        self.word = word or random.choice(self.word_list).upper()
        self.guesses = set(guesses) if guesses else set()
        self.remaining_attempts = remaining_attempts
        self.status = "ongoing"

    def guess(self, letter):
        letter = letter.upper()
        if letter in self.guesses:
            return False  # Letter was already guessed
        self.guesses.add(letter)
        
        if letter not in self.word:
            self.remaining_attempts -= 1

        if self.remaining_attempts <= 0:
            self.status = "lost"
        elif all(letter in self.guesses for letter in self.word):
            self.status = "won"

        return True

    def display_word(self):
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

    @classmethod
    def from_dict(cls, state):
        return cls(
            word_list=[],  # Empty because the word is already chosen
            word=state['word'],
            guesses=state['guesses'],
            remaining_attempts=state['remaining_attempts']
        )
