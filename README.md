# domindle

domindle is a Dominion card guessing game inspired by the classic mode of Loldle. Each round selects a hidden card from the local Dominion card database. You have six guesses to find it using category feedback.

## Features

- Local, browser-based game with no backend or API dependency
- Six guesses per round
- Newest guesses appear first
- Exact, partial, and incorrect type feedback
- Higher/lower feedback for numeric categories
- Dominion-inspired parchment, navy, oxblood, and brass visual design
- Card suggestions through the browser autocomplete list
- Card data for all supported expansions and promo cards

## Categories

After the first guess, domindle compares these categories with the hidden card:

- Card Type
- Cost
- Expansion
- +Cards
- +Coins
- +Buy
- +Action
- +VP
- +Coffers
- +Villagers

Green means an exact match. Amber means a partial match or a higher/lower hint. Red means the value does not match.

Card types use exact set matching for green feedback. For example, `Action` is only an exact match for another `Action` card. `Action / Reaction` receives partial feedback because it overlaps but is not identical.

## Run Locally

The app uses `fetch()` to load its JSON data, so it should be served over a local HTTP server rather than opened directly as a file.

With Python installed, run this from the project directory:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/) in a browser.

## Project Structure

```text
domindle/
|-- index.html
|-- script.js
|-- style.css
|-- data/
|   `-- dominion/
|       |-- all-cards.json
|       `-- base-set.json
`-- README.md
```

### Main Files

- `index.html` contains the game layout, clue panel, guess form, and guess-row template.
- `style.css` contains the responsive Dominion-inspired theme and feedback states.
- `script.js` loads the dataset, chooses a target, processes guesses, compares categories, and renders feedback.
- `data/dominion/all-cards.json` is the active local card database.
- `data/dominion/base-set.json` is the original base-set dataset.

## Card Data

The active dataset keeps a consistent record shape for every card. Important fields include:

```json
{
	"id": "market",
	"name": "Market",
	"types": ["Action"],
	"cost": 5,
	"costInPotions": 0,
	"costInDebt": 0,
	"text": "+1 Card\\n+1 Action\\n+1 Buy\\n+$1",
	"plusActions": 1,
	"plusCards": 1,
	"plusBuys": 1,
	"plusCoins": 1,
	"plusVictoryPoints": 0,
	"plusCoffers": 0,
	"plusVillagers": 0,
	"victoryPoints": 0,
	"coinValue": 1,
	"isKingdom": true,
	"expansion": "Base"
}
```

`all-cards.json` contains 650 unique cards from 17 sets, including basic cards, kingdom cards, Ruins, Shelters, Prizes, Travellers, Heirlooms, and promo cards.

The dataset intentionally excludes non-card game objects such as Boons, Hexes, States, Projects, Events, Ways, Landmarks, Artifacts, and other landscape materials.

## Updating the Dataset

When adding or changing cards:

1. Preserve the existing field names and value types.
2. Give every card a unique `id` and `name`.
3. Include zero for numeric categories that do not apply.
4. Keep `types` as an array of strings.
5. Keep each card's expansion in its `expansion` field.
6. Validate the JSON before testing the game.

The browser expects the active file at:

```text
data/dominion/all-cards.json
```

## Validation Checklist

Before committing data or gameplay changes, verify:

- The JSON parses successfully.
- Card names and IDs are unique.
- Required numeric fields exist on every card.
- The app loads without console errors.
- The first guess reveals feedback.
- Subsequent guesses appear newest-first.
- The clue panel and guess rows contain the same categories.
- The layout works on desktop and mobile widths.