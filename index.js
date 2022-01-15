import chalk from 'chalk';
import prompt from 'prompt';

import words from './data.json';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VALID_WORDS = words.map(({ word }) => word);

const GAME_SETTINGS = {
  maxGuessesPerRound: 6,
};

const rounds = [];

const printHeader = (title) => {
  const divider = chalk.blue('-'.repeat(process.stdout.columns));
  console.log(divider);
  console.log(title);
  console.log(divider);
};

const printInstructions = () => {
  printHeader('WORDLE PRACTICE');

  console.log(`
Guess the word in 6 tries.

Each guess must be a valid 5 letter word. Hit the Enter button to submit.

After each guess, you will see output that shows you how close your guess was to the word.

`)

  console.log(chalk.underline('Examples:\n'));
  printGuess('weary', 'witch');
  console.log('The letter W is in the word and in the correct spot.\n')
  printGuess('pills', 'think');
  console.log('The letter I is in the word but in the wrong spot.\n')
  printGuess('vague', 'think');
  console.log('None of the letters are in the word in any spot.\n')
};

const printGuess = (guess, solution) => {
  let output = '';

  const solutionLetterCounts = {};
  solution.split('').forEach((letter) => {
    if (!solutionLetterCounts[letter]) {
      solutionLetterCounts[letter] = 0;
    }
    solutionLetterCounts[letter] += 1;
  })

  const matchingLetterIndices = [];
  for (let i = 0; i < guess.length; i++) {
    const letter = guess.charAt(i);
    if (letter === solution.charAt(i)) {
      matchingLetterIndices.push(i);
      solutionLetterCounts[letter] -= 1;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    const letter = guess.charAt(i);
    if (matchingLetterIndices.includes(i)) {
      output += chalk.bgHex('#427646')(` ${letter.toUpperCase()} `);
    } else if (solution.includes(letter) && solutionLetterCounts[letter] > 0) {
      output += chalk.bgHex('#8B8000')(` ${letter.toUpperCase()} `);
      solutionLetterCounts[letter] -= 1;
    } else {
      output += chalk.bgGray(` ${letter.toUpperCase()} `);
    }
  }

  console.log(output);
}

const printUnusedLetters = (guesses) => {
  const unusedLetters = new Set(ALPHABET);
  guesses.forEach((guess) => {
    guess.split('').forEach((letter) => {
      unusedLetters.delete(letter);
    });
  });

  console.log(chalk.gray(`unused letters: ${Array(...unusedLetters).join(' ')}`));
}

const pickSolutionWord = () => {
  const previousRoundSolutions = rounds.map(({ solution }) => solution);
  const possibleSolutionWords = words
    .filter(({ word, solution }) => solution && !previousRoundSolutions.includes(word))
    .map(({ word }) => word);
  return possibleSolutionWords[Math.floor(Math.random() * possibleSolutionWords.length)];
};

const playRound = async () => {
  printHeader(`ROUND ${rounds.length + 1}`);

  const round = {
    solution: pickSolutionWord(),
    guesses: [],
    won: false,
  };

  for (let i = 0; i < GAME_SETTINGS.maxGuessesPerRound; i++) {
    const { guess } = await prompt.get([{
      name: 'guess',
      type: 'string',
      message: 'Must be a valid 5-letter word',
      conform: (input) => VALID_WORDS.includes(input.toLowerCase()),
      before: (input) => input.toLowerCase(),
    }]);
    round.guesses.push(guess);

    printGuess(guess, round.solution);
    printUnusedLetters(round.guesses);
    console.log();

    if (guess === round.solution) {
      round.won = true;
      console.log('Congrats! You win!');
      break;
    }
  }

  if (!round.won) {
    console.log(`Sorry, you lost. The correct answer was ${chalk.bold(round.solution)}.`);
  }
  rounds.push(round);
};

const printStatistics = () => {
  const roundsWon = rounds.filter(({ won }) => won);

  const roundsWonPerNumberOfGuesses = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  roundsWon.forEach((round) => {
    roundsWonPerNumberOfGuesses[round.guesses.length] += 1;
  });

  printHeader('STATISTICS');
  console.log(`${roundsWon.length} / ${rounds.length} rounds won\n`);
  console.log(chalk.underline('Guess Distribution\n'));
  Object.entries(roundsWonPerNumberOfGuesses).forEach(([numberOfGuesses, roundsWon]) => {
    console.log(`${chalk.bold(numberOfGuesses)}: ${roundsWon}`);
  });
};

const playGame = async () => {
  prompt.message = null;
  prompt.start();

  printInstructions();

  while (true) {
    await playRound();
    printStatistics();
  }
};

playGame();
