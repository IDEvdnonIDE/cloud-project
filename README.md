# Spoonful

A community recipe book. Anyone can search and browse recipes. Signed-in users can vote, comment and save favourites, and chefs can publish and edit their own recipes.

There is no backend yet. All data lives in the browser's `localStorage` and is seeded from `src/data/seed.js` on first load. The footer has a "Reset demo data" button that restores the seed.

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint` (oxlint).

## Demo accounts

Password for every seed account: `password`.

| Email | Role |
| --- | --- |
| `chef@demo.com` | Chef (can publish recipes, has a dashboard) |
| `user@demo.com` | Food lover (vote, comment, save) |

## Features

- Search by keyword, filter by time, difficulty, cuisine, meal and diet. All filters live in the URL, so a search can be bookmarked or shared.
- "What can I cook?": enter ingredients you have and recipes are ranked by how many they use.
- Recipe pages with a servings scaler, ingredient checklist and a full-screen step-by-step cook mode.
- Up/down votes, comments, and saved recipes on your profile.
- Chef dashboard and a recipe editor with live preview and photo upload.

## Project layout

- `src/pages/`: one component per route (see `src/App.jsx`).
- `src/components/`: shared UI pieces.
- `src/services/api.js`: mock API over `localStorage`. Every function is async and returns plain data, so it can be swapped for `fetch()` calls when a real backend exists.
- `src/data/seed.js`: demo users, recipes, votes and comments.
- `src/styles/custom.scss`: Bootstrap variable overrides that set the theme.

Built with React, React Router, React Bootstrap and Vite.
