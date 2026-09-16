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
  suggestionMenu: document.getElementById('card-suggestions'),
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
  plusDebtClue: document.getElementById('plus-debt-clue'),
  newGameButton: document.getElementById('new-game-button'),
  winModal: document.getElementById('win-modal'),
  winClose: document.getElementById('win-close'),
  winNewGame: document.getElementById('win-new-game'),
  winCardName: document.getElementById('win-card-name'),
  confetti: document.getElementById('confetti'),
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
  return actualValue === guessValue ? 'match' : 'bad';
}

function numericDirection(actualValue, guessValue) {
  if (actualValue == null || guessValue == null || actualValue === guessValue) return '';
  return guessValue < actualValue ? '↑' : '↓';
}

function formatNumericGuess(actualValue, guessValue) {
  const arrow = numericDirection(actualValue, guessValue);
  return arrow ? `${guessValue} ${arrow}` : `${guessValue}`;
}

const expansionReleaseOrder = {
  Base: 200810,
  Intrigue: 200907,
  Seaside: 200910,
  Alchemy: 201005,
  Prosperity: 201010,
  'Cornucopia and Guilds': 201106,
  Hinterlands: 201110,
  'Dark Ages': 201208,
  Adventures: 201504,
  Empires: 201606,
  Nocturne: 201711,
  Renaissance: 201811,
  Menagerie: 202003,
  Allies: 202203,
  Plunder: 202212,
  'Rising Sun': 202408,
  Arcana: 202601,
};

const promoReleaseOrder = {
  Envoy: 200811,
  'Black Market': 200903,
  Stash: 201002,
  'Walled Village': 201106,
  Governor: 201110,
  Prince: 201406,
  Summon: 201511,
  Sauna: 201609,
  Avanto: 201609,
  Dismantle: 201712,
  Church: 201908,
  Captain: 201908,
  Marchland: 202403,
};

function costComponents(card) {
  return [
    ['coins', Number(card.cost) || 0],
    ['potion', card.costInPotions === true ? 1 : Number(card.costInPotions) || 0],
    ['debt', Number(card.costInDebt) || 0],
  ].filter(([, amount]) => amount > 0);
}

function compareCost(actualCard, guessCard) {
  const actualCost = costComponents(actualCard);
  const guessCost = costComponents(guessCard);

  if (actualCost.length === guessCost.length && actualCost.every(([type, amount], index) => (
    type === guessCost[index][0] && amount === guessCost[index][1]
  ))) return 'match';

  const matchingComponent = actualCost.some(([type, amount]) => (
    guessCost.some(([guessType, guessAmount]) => type === guessType && amount === guessAmount)
  ));
  return matchingComponent ? 'partial' : 'bad';
}

function costDirection(actualCard, guessCard) {
  const actualCost = costComponents(actualCard);
  const guessCost = costComponents(guessCard);
  if (compareCost(actualCard, guessCard) === 'match') return '';

  if (actualCost.length !== guessCost.length) {
    return actualCost.length > guessCost.length ? '↑' : '↓';
  }

  const actualTotal = actualCost.reduce((total, [, amount]) => total + amount, 0);
  const guessTotal = guessCost.reduce((total, [, amount]) => total + amount, 0);
  if (actualTotal > guessTotal) return '↑';
  if (actualTotal < guessTotal) return '↓';
  return '↔';
}

function formatCost(card) {
  const parts = [];
  if (card.cost > 0 || (!card.costInPotions && !card.costInDebt)) parts.push(`${card.cost} coins`);
  if (card.costInPotions) parts.push(card.costInPotions === true ? 'Potion' : `${card.costInPotions} Potion`);
  if (card.costInDebt) parts.push(`${card.costInDebt} Debt`);
  return parts.join(' + ');
}

function releaseRank(card) {
  if (card.expansion === 'Promo') return promoReleaseOrder[card.name] || 0;
  return expansionReleaseOrder[card.expansion] || 0;
}

function compareExpansion(actualCard, guessCard) {
  if (!actualCard.expansion || !guessCard.expansion) return 'bad';
  return actualCard.expansion === guessCard.expansion ? 'match' : 'bad';
}

function expansionDirection(actualCard, guessCard) {
  const actualRank = releaseRank(actualCard);
  const guessRank = releaseRank(guessCard);
  if (!actualRank || !guessRank || actualRank === guessRank) return '';
  return guessRank < actualRank ? '↑' : '↓';
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
  return 'Wrong';
}

function applyClueBox(boxElement, status, text) {
  boxElement.textContent = text;
  boxElement.parentElement.classList.remove('neutral', 'good', 'warn', 'bad');

  if (status === 'match') {
    boxElement.parentElement.classList.add('good');
  } else if (status === 'partial') {
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

function hideWinModal() {
  elements.winModal.hidden = true;
  elements.confetti.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function showWinModal() {
  elements.winCardName.textContent = state.target.name;
  elements.confetti.innerHTML = '';
  const colors = ['#b7853d', '#dfbb71', '#842f3c', '#3f7658', '#1d3448'];
  for (let index = 0; index < 34; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--confetti-color', colors[index % colors.length]);
    piece.style.setProperty('--confetti-x', `${(Math.random() - 0.5) * 110}vw`);
    piece.style.setProperty('--confetti-y', `${70 + Math.random() * 35}vh`);
    piece.style.setProperty('--confetti-delay', `${Math.random() * 0.18}s`);
    piece.style.setProperty('--confetti-rotate', `${Math.random() * 720 - 360}deg`);
    elements.confetti.appendChild(piece);
  }
  elements.winModal.hidden = false;
  document.body.classList.add('modal-open');
  elements.winNewGame.focus();
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
      elements.plusDebtClue,
    ].forEach((el) => {
      el.textContent = '—';
      el.parentElement.classList.remove('neutral', 'good', 'warn', 'bad');
      el.parentElement.classList.add('neutral');
    });
    return;
  }

  const latestGuess = state.guesses[state.guesses.length - 1];

  const typeStatus = compareType(state.target.types, latestGuess.types);
  const costStatus = compareCost(state.target, latestGuess);
  const expansionStatus = compareExpansion(state.target, latestGuess);
  const cardsStatus = compareNumeric(state.target.plusCards, latestGuess.plusCards);
  const coinsStatus = compareNumeric(state.target.plusCoins, latestGuess.plusCoins);
  const buysStatus = compareNumeric(state.target.plusBuys, latestGuess.plusBuys);
  const actionsStatus = compareNumeric(state.target.plusActions, latestGuess.plusActions);
  const vpStatus = compareNumeric(state.target.plusVictoryPoints, latestGuess.plusVictoryPoints);
  const coffersStatus = compareNumeric(state.target.plusCoffers, latestGuess.plusCoffers);
  const villagersStatus = compareNumeric(state.target.plusVillagers, latestGuess.plusVillagers);
  const debtStatus = compareNumeric(state.target.plusDebt, latestGuess.plusDebt);

  applyClueBox(elements.typeClue, typeStatus, formatType(latestGuess.types));
  applyClueBox(elements.costClue, costStatus, `${formatCost(latestGuess)} ${costDirection(state.target, latestGuess)}`.trim());
  applyClueBox(elements.expansionClue, expansionStatus, `${formatExpansion(latestGuess.expansion)} ${expansionDirection(state.target, latestGuess)}`.trim());
  applyClueBox(elements.plusCardsClue, cardsStatus, formatNumericGuess(state.target.plusCards, latestGuess.plusCards));
  applyClueBox(elements.plusCoinsClue, coinsStatus, formatNumericGuess(state.target.plusCoins, latestGuess.plusCoins));
  applyClueBox(elements.plusBuysClue, buysStatus, formatNumericGuess(state.target.plusBuys, latestGuess.plusBuys));
  applyClueBox(elements.plusActionsClue, actionsStatus, formatNumericGuess(state.target.plusActions, latestGuess.plusActions));
  applyClueBox(elements.plusVpClue, vpStatus, formatNumericGuess(state.target.plusVictoryPoints, latestGuess.plusVictoryPoints));
  applyClueBox(elements.plusCoffersClue, coffersStatus, formatNumericGuess(state.target.plusCoffers, latestGuess.plusCoffers));
  applyClueBox(elements.plusVillagersClue, villagersStatus, formatNumericGuess(state.target.plusVillagers, latestGuess.plusVillagers));
  applyClueBox(elements.plusDebtClue, debtStatus, formatNumericGuess(state.target.plusDebt, latestGuess.plusDebt));
}

function renderSuggestions() {
  renderSuggestionMenu('');
}

function renderSuggestionMenu(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = state.cards
    .filter((card) => card.name.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);

  elements.suggestionMenu.innerHTML = matches.map((card) => (
    `<button class="suggestion-option" type="button" role="option" data-card-name="${card.name}">${card.name}<span>${card.expansion}</span></button>`
  )).join('');
  elements.guessInput.setAttribute('aria-expanded', matches.length > 0 ? 'true' : 'false');
}

function hideSuggestions() {
  elements.suggestionMenu.innerHTML = '';
  elements.guessInput.setAttribute('aria-expanded', 'false');
}

function renderGuessRows() {
  elements.guessList.innerHTML = '';

  for (const guess of [...state.guesses].reverse()) {
    const row = elements.guessTemplate.content.cloneNode(true);
    const guessName = row.querySelector('.guess-name');
    const stats = row.querySelectorAll('.guess-stat');

    guessName.textContent = guess.name;

    const typeStatus = compareType(state.target.types, guess.types);
    const costStatus = compareCost(state.target, guess);
    const expansionStatus = compareExpansion(state.target, guess);
    const cardsStatus = compareNumeric(state.target.plusCards, guess.plusCards);
    const coinsStatus = compareNumeric(state.target.plusCoins, guess.plusCoins);
    const buysStatus = compareNumeric(state.target.plusBuys, guess.plusBuys);
    const actionsStatus = compareNumeric(state.target.plusActions, guess.plusActions);
    const vpStatus = compareNumeric(state.target.plusVictoryPoints, guess.plusVictoryPoints);
    const coffersStatus = compareNumeric(state.target.plusCoffers, guess.plusCoffers);
    const villagersStatus = compareNumeric(state.target.plusVillagers, guess.plusVillagers);
    const debtStatus = compareNumeric(state.target.plusDebt, guess.plusDebt);

    stats[0].querySelector('strong').textContent = formatType(guess.types);
    stats[0].classList.add(typeStatus === 'match' ? 'match' : typeStatus === 'partial' ? 'warn' : 'bad');

    stats[1].querySelector('strong').textContent = `${formatCost(guess)} ${costDirection(state.target, guess)}`.trim(); // • ${statusText(costStatus)}
    stats[1].classList.add(costStatus === 'match' ? 'match' : costStatus === 'partial' ? 'warn' : 'bad');

    stats[2].querySelector('strong').textContent = `${formatExpansion(guess.expansion)} ${expansionDirection(state.target, guess)}`.trim();
    stats[2].classList.add(expansionStatus === 'match' ? 'match' : 'bad');

    stats[3].querySelector('strong').textContent = formatNumericGuess(state.target.plusCards, guess.plusCards);
    stats[3].classList.add(cardsStatus === 'match' ? 'match' : 'bad');

    stats[4].querySelector('strong').textContent = formatNumericGuess(state.target.plusCoins, guess.plusCoins);
    stats[4].classList.add(coinsStatus === 'match' ? 'match' : 'bad');

    stats[5].querySelector('strong').textContent = formatNumericGuess(state.target.plusBuys, guess.plusBuys);
    stats[5].classList.add(buysStatus === 'match' ? 'match' : 'bad');

    stats[6].querySelector('strong').textContent = formatNumericGuess(state.target.plusActions, guess.plusActions);
    stats[6].classList.add(actionsStatus === 'match' ? 'match' : 'bad');

    stats[7].querySelector('strong').textContent = formatNumericGuess(state.target.plusVictoryPoints, guess.plusVictoryPoints);
    stats[7].classList.add(vpStatus === 'match' ? 'match' : 'bad');

    stats[8].querySelector('strong').textContent = formatNumericGuess(state.target.plusCoffers, guess.plusCoffers);
    stats[8].classList.add(coffersStatus === 'match' ? 'match' : 'bad');

    stats[9].querySelector('strong').textContent = formatNumericGuess(state.target.plusVillagers, guess.plusVillagers);
    stats[9].classList.add(villagersStatus === 'match' ? 'match' : 'bad');

    stats[10].querySelector('strong').textContent = formatNumericGuess(state.target.plusDebt, guess.plusDebt);
    stats[10].classList.add(debtStatus === 'match' ? 'match' : 'bad');

    elements.guessList.appendChild(row);
  }

  elements.guessCount.textContent = `${state.guesses.length} ${state.guesses.length === 1 ? 'guess' : 'guesses'}`;
}

function endGame(won) {
  state.won = won;
  state.lost = !won;
  elements.guessInput.disabled = true;
  elements.guessForm.querySelector('button').disabled = true;

  if (won) {
    setMessage(`Correct! You guessed ${state.target.name}.`, 'success');
    //showWinModal();
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
  hideSuggestions();
  renderGuessRows();
  renderClues();

  if (guessedCard.id === state.target.id) {
    endGame(true);
    return;
  }

  setMessage('Not quite. The clue panel has updated with the category feedback.', '');
}

function startNewGame() {
  hideWinModal();
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
      plusDebt: card.plusDebt ?? Number((card.text || '').match(/(?:\+|take |add )(\d+) Debt/i)?.[1] || 0),
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
elements.winClose.addEventListener('click', hideWinModal);
elements.winNewGame.addEventListener('click', startNewGame);
elements.winModal.addEventListener('click', (event) => {
  if (event.target === elements.winModal) hideWinModal();
});
elements.guessInput.addEventListener('focus', () => renderSuggestionMenu(elements.guessInput.value));
elements.guessInput.addEventListener('input', () => renderSuggestionMenu(elements.guessInput.value));
elements.suggestionMenu.addEventListener('click', (event) => {
  const option = event.target.closest('.suggestion-option');
  if (!option) return;
  elements.guessInput.value = option.dataset.cardName;
  hideSuggestions();
  elements.guessInput.focus();
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.guess-input-wrap')) hideSuggestions();
});

init();
