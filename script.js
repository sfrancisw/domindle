const MAX_GUESSES = 6;
const state = {
  cards: [],
  target: null,
  guesses: [],
  won: false,
  lost: false,
};

const elements = {
  guessForm: document.getElementById('guess-form'),
  guessInput: document.getElementById('guess-input'),
  guessList: document.getElementById('guess-list'),
  cardSuggestions: document.getElementById('card-suggestions'),
  message: document.getElementById('message'),
  guessCount: document.getElementById('guess-count'),
  typeClue: document.getElementById('type-clue'),
  costClue: document.getElementById('cost-clue'),
  expansionClue: document.getElementById('expansion-clue'),
  plusCardsClue: document.getElementById('plus-cards-clue'),
  plusCoinsClue: document.getElementById('plus-coins-clue'),
  plusBuysClue: document.getElementById('plus-buys-clue'),
  plusActionsClue: document.getElementById('plus-actions-clue'),
  plusVpClue: document.getElementById('plus-vp-clue'),
  plusCoffersClue: document.getElementById('plus-coffers-clue'),
  plusVillagersClue: document.getElementById('plus-villagers-clue'),
  newGameButton: document.getElementById('new-game-button'),
  guessTemplate: document.getElementById('guess-row-template'),
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function compareType(actualTypes, guessTypes) {
  if (!actualTypes || !guessTypes) return 'bad';
  const actual = Array.isArray(actualTypes) ? actualTypes : [actualTypes];
  const guess = Array.isArray(guessTypes) ? guessTypes : [guessTypes];

  const exactMatch =
    actual.length === guess.length &&
    actual.every((type) => guess.includes(type)) &&
    guess.every((type) => actual.includes(type));
  if (exactMatch) return 'match';

  const overlap = actual.some((type) => guess.includes(type));
  return overlap ? 'partial' : 'bad';
}

function compareNumeric(actualValue, guessValue) {
  if (actualValue == null || guessValue == null) return 'bad';
  if (actualValue === guessValue) return 'match';
  return guessValue < actualValue ? 'higher' : 'lower';
}

function compareExpansion(actualExpansion, guessExpansion) {
  if (!actualExpansion || !guessExpansion) return 'bad';
  return actualExpansion === guessExpansion ? 'match' : 'bad';
}

function formatType(types) {
  if (!types || !types.length) return '—';
  return types.join(' / ');
}

function formatExpansion(value) {
  if (!value) return '—';
  return value;
}

function statusText(status) {
  if (status === 'match') return 'Exact';
  if (status === 'partial') return 'Partial';
  if (status === 'higher') return 'Higher';
  if (status === 'lower') return 'Lower';
  return 'Wrong';
}

function applyClueBox(boxElement, status, text) {
  boxElement.textContent = text;
  boxElement.parentElement.classList.remove('neutral', 'good', 'warn', 'bad');

  if (status === 'match') {
    boxElement.parentElement.classList.add('good');
  } else if (status === 'partial' || status === 'higher' || status === 'lower') {
    boxElement.parentElement.classList.add('warn');
  } else if (status === 'bad') {
    boxElement.parentElement.classList.add('bad');
  } else {
    boxElement.parentElement.classList.add('neutral');
  }
}

function setMessage(text, kind = '') {
  elements.message.textContent = text;
  elements.message.className = `message ${kind}`.trim();
}

function renderClues() {
  if (state.guesses.length === 0) {
    [
      elements.typeClue,
      elements.costClue,
      elements.expansionClue,
      elements.plusCardsClue,
      elements.plusCoinsClue,
      elements.plusBuysClue,
      elements.plusActionsClue,
      elements.plusVpClue,
      elements.plusCoffersClue,
      elements.plusVillagersClue,
    ].forEach((el) => {
      el.textContent = '—';
      el.parentElement.classList.remove('neutral', 'good', 'warn', 'bad');
      el.parentElement.classList.add('neutral');
    });
    return;
  }

  const latestGuess = state.guesses[state.guesses.length - 1];

  const typeStatus = compareType(state.target.types, latestGuess.types);
  const costStatus = compareNumeric(state.target.cost, latestGuess.cost);
  const expansionStatus = compareExpansion(state.target.expansion, latestGuess.expansion);
  const cardsStatus = compareNumeric(state.target.plusCards, latestGuess.plusCards);
  const coinsStatus = compareNumeric(state.target.plusCoins, latestGuess.plusCoins);
  const buysStatus = compareNumeric(state.target.plusBuys, latestGuess.plusBuys);
  const actionsStatus = compareNumeric(state.target.plusActions, latestGuess.plusActions);
  const vpStatus = compareNumeric(state.target.plusVictoryPoints, latestGuess.plusVictoryPoints);
  const coffersStatus = compareNumeric(state.target.plusCoffers, latestGuess.plusCoffers);
  const villagersStatus = compareNumeric(state.target.plusVillagers, latestGuess.plusVillagers);

  applyClueBox(elements.typeClue, typeStatus, formatType(latestGuess.types));
  applyClueBox(elements.costClue, costStatus, statusText(costStatus));
  applyClueBox(elements.expansionClue, expansionStatus, formatExpansion(latestGuess.expansion));
  applyClueBox(elements.plusCardsClue, cardsStatus, statusText(cardsStatus));
  applyClueBox(elements.plusCoinsClue, coinsStatus, statusText(coinsStatus));
  applyClueBox(elements.plusBuysClue, buysStatus, statusText(buysStatus));
  applyClueBox(elements.plusActionsClue, actionsStatus, statusText(actionsStatus));
  applyClueBox(elements.plusVpClue, vpStatus, statusText(vpStatus));
  applyClueBox(elements.plusCoffersClue, coffersStatus, statusText(coffersStatus));
  applyClueBox(elements.plusVillagersClue, villagersStatus, statusText(villagersStatus));
}

function renderSuggestions() {
  const options = state.cards
    .map((card) => `<option value="${card.name}"></option>`)
    .join('');
  elements.cardSuggestions.innerHTML = options;
}

function renderGuessRows() {
  elements.guessList.innerHTML = '';

  for (const guess of [...state.guesses].reverse()) {
    const row = elements.guessTemplate.content.cloneNode(true);
    const guessName = row.querySelector('.guess-name');
    const stats = row.querySelectorAll('.guess-stat');

    guessName.textContent = guess.name;

    const typeStatus = compareType(state.target.types, guess.types);
    const costStatus = compareNumeric(state.target.cost, guess.cost);
    const expansionStatus = compareExpansion(state.target.expansion, guess.expansion);
    const cardsStatus = compareNumeric(state.target.plusCards, guess.plusCards);
    const coinsStatus = compareNumeric(state.target.plusCoins, guess.plusCoins);
    const buysStatus = compareNumeric(state.target.plusBuys, guess.plusBuys);
    const actionsStatus = compareNumeric(state.target.plusActions, guess.plusActions);
    const vpStatus = compareNumeric(state.target.plusVictoryPoints, guess.plusVictoryPoints);
    const coffersStatus = compareNumeric(state.target.plusCoffers, guess.plusCoffers);
    const villagersStatus = compareNumeric(state.target.plusVillagers, guess.plusVillagers);

    stats[0].querySelector('strong').textContent = formatType(guess.types);
    stats[0].classList.add(typeStatus === 'match' ? 'match' : typeStatus === 'partial' ? 'warn' : 'bad');

    stats[1].querySelector('strong').textContent = `${guess.cost} • ${statusText(costStatus)}`;
    stats[1].classList.add(costStatus === 'match' ? 'match' : costStatus === 'higher' || costStatus === 'lower' ? 'warn' : 'bad');

    stats[2].querySelector('strong').textContent = formatExpansion(guess.expansion);
    stats[2].classList.add(expansionStatus === 'match' ? 'match' : 'bad');

    stats[3].querySelector('strong').textContent = `${guess.plusCards} • ${statusText(cardsStatus)}`;
    stats[3].classList.add(cardsStatus === 'match' ? 'match' : cardsStatus === 'higher' || cardsStatus === 'lower' ? 'warn' : 'bad');

    stats[4].querySelector('strong').textContent = `${guess.plusCoins} • ${statusText(coinsStatus)}`;
    stats[4].classList.add(coinsStatus === 'match' ? 'match' : coinsStatus === 'higher' || coinsStatus === 'lower' ? 'warn' : 'bad');

    stats[5].querySelector('strong').textContent = `${guess.plusBuys} • ${statusText(buysStatus)}`;
    stats[5].classList.add(buysStatus === 'match' ? 'match' : buysStatus === 'higher' || buysStatus === 'lower' ? 'warn' : 'bad');

    stats[6].querySelector('strong').textContent = `${guess.plusActions} • ${statusText(actionsStatus)}`;
    stats[6].classList.add(actionsStatus === 'match' ? 'match' : actionsStatus === 'higher' || actionsStatus === 'lower' ? 'warn' : 'bad');

    stats[7].querySelector('strong').textContent = `${guess.plusVictoryPoints} • ${statusText(vpStatus)}`;
    stats[7].classList.add(vpStatus === 'match' ? 'match' : vpStatus === 'higher' || vpStatus === 'lower' ? 'warn' : 'bad');

    stats[8].querySelector('strong').textContent = `${guess.plusCoffers} • ${statusText(coffersStatus)}`;
    stats[8].classList.add(coffersStatus === 'match' ? 'match' : coffersStatus === 'higher' || coffersStatus === 'lower' ? 'warn' : 'bad');

    stats[9].querySelector('strong').textContent = `${guess.plusVillagers} • ${statusText(villagersStatus)}`;
    stats[9].classList.add(villagersStatus === 'match' ? 'match' : villagersStatus === 'higher' || villagersStatus === 'lower' ? 'warn' : 'bad');

    elements.guessList.appendChild(row);
  }

  elements.guessCount.textContent = `${state.guesses.length} / ${MAX_GUESSES}`;
}

function endGame(won) {
  state.won = won;
  state.lost = !won;
  elements.guessInput.disabled = true;
  elements.guessForm.querySelector('button').disabled = true;

  if (won) {
    setMessage(`Correct! You guessed ${state.target.name}.`, 'success');
  } else {
    setMessage(`Out of guesses. The card was ${state.target.name}.`, 'error');
  }
}

function handleGuess(event) {
  event.preventDefault();

  if (state.won || state.lost) return;

  const guessName = elements.guessInput.value.trim();
  if (!guessName) {
    setMessage('Enter a card name first.', 'error');
    return;
  }

  const guessedCard = state.cards.find((card) => card.name.toLowerCase() === guessName.toLowerCase());
  if (!guessedCard) {
    setMessage('That card is not in the Dominion base set.', 'error');
    return;
  }

  const alreadyGuessed = state.guesses.some((card) => card.id === guessedCard.id);
  if (alreadyGuessed) {
    setMessage('You already guessed that card.', 'error');
    elements.guessInput.value = '';
    return;
  }

  state.guesses.push(guessedCard);
  elements.guessInput.value = '';
  renderGuessRows();
  renderClues();

  if (guessedCard.id === state.target.id) {
    endGame(true);
    return;
  }

  if (state.guesses.length >= MAX_GUESSES) {
    endGame(false);
    return;
  }

  setMessage('Not quite. The clue panel has updated with the category feedback.', '');
}

function startNewGame() {
  const availableCards = shuffle([...state.cards]);
  state.target = availableCards[Math.floor(Math.random() * availableCards.length)];
  state.guesses = [];
  state.won = false;
  state.lost = false;

  elements.guessInput.disabled = false;
  const submitButton = elements.guessForm.querySelector('button');
  submitButton.disabled = false;

  elements.guessInput.value = '';
  setMessage('No clues yet. Make your first guess to reveal the category feedback.', '');
  renderGuessRows();
  renderClues();
  elements.guessInput.focus();
}

async function init() {
  try {
    const response = await fetch('./data/dominion/all-cards.json');
    if (!response.ok) {
      throw new Error('Failed to load data');
    }

    const data = await response.json();
    const missingStatFields = data.cards.filter(
      (card) => !['plusActions', 'plusCards', 'plusBuys', 'plusCoins'].every((key) => key in card)
    );
    if (missingStatFields.length > 0) {
      throw new Error(`Missing stat fields in dataset: ${missingStatFields[0].name}`);
    }

    state.cards = data.cards.map((card) => ({
      ...card,
      plusVictoryPoints: card.plusVictoryPoints ?? 0,
      plusCoffers: card.plusCoffers ?? Number((card.text || '').match(/\+(\d+) Coffers?/i)?.[1] || 0),
      plusVillagers: card.plusVillagers ?? Number((card.text || '').match(/\+(\d+) Villagers?/i)?.[1] || 0),
      expansion: card.expansion || data.expansion,
    }));
    renderSuggestions();
    startNewGame();
  } catch (error) {
    console.error(error);
    setMessage('Could not load the Dominion data set.', 'error');
  }
}

elements.guessForm.addEventListener('submit', handleGuess);
elements.newGameButton.addEventListener('click', startNewGame);

init();
