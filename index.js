import fs from 'fs';

import chalk from 'chalk';
import prompt from 'prompt';

import words from './data/words.json';
import history from './data/history.json';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VALID_WORDS = words.map(({ word }) => word);
const PREVIOUS_ROUNDS = history;

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
      description: `guess ${i + 1}`,
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
  printHeader('STATISTICS');

  const roundsWon = rounds.filter(({ won }) => won);
  const allTimeRoundsWon = [...PREVIOUS_ROUNDS, ...rounds].filter(({ won }) => won);
  const allTimeGuessDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  allTimeRoundsWon.forEach((round) => {
    allTimeGuessDistribution[round.guesses.length] += 1;
  });
  console.log(`${roundsWon.length} / ${rounds.length} rounds won this game`);
  console.log(`${allTimeRoundsWon.length} / ${allTimeRoundsWon.length} rounds won all-time\n`);
  console.log(chalk.underline('guess distribution (all-time)'));
  Object.entries(allTimeGuessDistribution).forEach(([numberOfGuesses, roundsWon]) => {
    console.log(`${chalk.bold(numberOfGuesses)}: ${roundsWon}`);
  });
};

const saveHistoryAndExit = () => {
  const data = JSON.stringify([...PREVIOUS_ROUNDS, ...rounds], null, 2);
  fs.writeFile('data/history.json', data, (err) => {
    if (err) {
      throw err;
    } else {
      console.log(chalk.blue('\nGame results saved. See you next time!'));
    }
    process.exit(0);
  });
};

const main = async () => {
  prompt.message = null;
  prompt.start();

  printInstructions();

  let shouldKeepPlaying = true;
  while (shouldKeepPlaying) {
    await playRound();
    printStatistics();
    const { playAgain } = await prompt.get([{
      description: 'play another round? (y/n)',
      name: 'playAgain',
      type: 'string',
      message: 'Enter "y" for yes and "n" for no',
      conform: (input) => ['y', 'n'].includes(input),
      before: (input) => input.toLowerCase()[0],
    }]);
    shouldKeepPlaying = playAgain === 'y';
  }
};

main();

process.on('beforeExit', () => saveHistoryAndExit());
