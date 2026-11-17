# Spoonful

A community recipe book. Anyone can search and browse recipes. Signed-in users can vote, comment and save favourites, and chefs can publish and edit their own recipes. Admins can moderate content (delete any recipe, comment or vote).

## Stack

- **Frontend:** React, React Router, React Bootstrap, Vite
- **Backend:** Firebase (Authentication + Cloud Firestore)
- **Auth providers:** Email/Password, Google Sign-In

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

New accounts can also be created via the sign-up page or Google Sign-In.

## Features

- Search by keyword, filter by time, difficulty, cuisine, meal and diet. All filters live in the URL, so a search can be bookmarked or shared.
- "What can I cook?": enter ingredients you have and recipes are ranked by how many they use.
- Recipe pages with a servings scaler, ingredient checklist and a full-screen step-by-step cook mode.
- Up/down votes, comments, and saved recipes on your profile.
- Chef dashboard and a recipe editor with live preview and photo upload.

## Project layout

- `src/pages/` — one component per route (see `src/App.jsx`).
- `src/components/` — shared UI pieces.
- `src/context/AuthContext.jsx` — Firebase Auth state management (login, register, Google sign-in, profile sync).
- `src/services/firebase.js` — Firebase SDK configuration.
- `src/services/api.js` — Firestore API layer. Every function is async and returns plain data.
- `src/styles/custom.scss` — Bootstrap variable overrides that set the theme.
- `firestore.rules` — Firestore Security Rules (role-based access control).

## Firestore collections

| Collection | Description |
| --- | --- |
| `users` | User profiles (name, avatar, role, bio, favourites) |
| `recipes` | Recipes with denormalized vote counts (`ups`, `downs`) and `commentCount` |
| `votes` | One doc per user-recipe pair (ID: `{recipeId}_{userId}`) |
| `comments` | Comments linked to recipes by `recipeId` |

## Security rules

Four access levels enforced by Firestore Security Rules:

| Role | Permissions |
| --- | --- |
| Not signed in | Read-only |
| User (`user`) | Vote, comment, save favourites, edit own profile |
| Chef (`creator`) | All above + create, edit and delete own recipes |
| Admin (`admin`) | All above + delete any recipe, comment or vote |