// Mock API backed by localStorage.
// Every function is async and returns plain data, so when you build the real
// backend you only need to swap these bodies for fetch() calls.
import * as db from './storage';
import { seedUsers, seedRecipes, seedVotes, seedComments } from '../data/seed';
import { MEAL_TYPES, DIETS, DIFFICULTIES } from '../utils/constants';
import { uid } from '../utils/format';

const DB_VERSION = 1;
const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function seed() {
  db.write('users', seedUsers);
  db.write('recipes', seedRecipes);
  db.write('votes', seedVotes);
  db.write('comments', seedComments);
  db.write('version', DB_VERSION);
}

if (db.read('version') !== DB_VERSION) seed();

const load = (key) => db.read(key, key === 'votes' ? {} : []);

function save(key, value) {
  if (!db.write(key, value)) {
    throw new Error('Could not save — your browser storage may be full. Try a smaller image.');
  }
}

function publicUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
}

function context() {
  const users = load('users');
  return {
    usersById: Object.fromEntries(users.map((u) => [u.id, u])),
    votes: load('votes'),
    comments: load('comments'),
  };
}

function voteCounts(votesForRecipe = {}) {
  const values = Object.values(votesForRecipe);
  return {
    ups: values.filter((v) => v === 1).length,
    downs: values.filter((v) => v === -1).length,
  };
}

function enrich(recipe, ctx) {
  const { ups, downs } = voteCounts(ctx.votes[recipe.id]);
  const author = ctx.usersById[recipe.authorId];
  return {
    ...recipe,
    totalTime: (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0),
    ups,
    downs,
    score: ups - downs,
    commentCount: ctx.comments.filter((c) => c.recipeId === recipe.id).length,
    author: author
      ? { id: author.id, name: author.name, avatar: author.avatar }
      : { id: recipe.authorId, name: 'Unknown chef', avatar: '🧑‍🍳' },
  };
}

function requireUser(user) {
  if (!user) throw new Error('Please log in first.');
}

function requireCreator(user) {
  requireUser(user);
  if (user.role !== 'creator') throw new Error('Only chefs can manage recipes.');
}

function sanitizeRecipe(data) {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    emoji: data.emoji || '🍽️',
    image: data.image || '',
    prepTime: Math.max(0, Number(data.prepTime) || 0),
    cookTime: Math.max(0, Number(data.cookTime) || 0),
    servings: Math.max(1, Number(data.servings) || 1),
    difficulty: DIFFICULTIES.includes(data.difficulty) ? data.difficulty : 'Easy',
    cuisine: data.cuisine.trim(),
    mealType: data.mealType,
    tags: data.tags || [],
    ingredients: data.ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        qty: ing.qty === '' || ing.qty === null || ing.qty === undefined ? null : Number(ing.qty),
        unit: (ing.unit || '').trim(),
        name: ing.name.trim(),
      })),
    steps: data.steps.map((s) => s.trim()).filter(Boolean),
  };
}

/* ----------------------------- Recipes ----------------------------- */

export async function getRecipes(filters = {}) {
  await wait();
  const {
    q = '',
    ingredients = [],
    matchAll = false,
    maxTime = 0,
    difficulty = '',
    cuisine = '',
    mealType = '',
    diets = [],
    authorId = '',
    sort = 'top',
  } = filters;

  const ctx = context();
  let list = load('recipes').map((r) => enrich(r, ctx));

  if (authorId) list = list.filter((r) => r.authorId === authorId);

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length) {
    list = list.filter((r) => {
      const haystack = [r.title, r.description, r.cuisine, r.mealType, r.author.name, ...(r.tags || []), ...r.ingredients.map((x) => x.name)]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }

  if (ingredients.length) {
    const wanted = ingredients.map((x) => x.toLowerCase());
    list = list
      .map((r) => {
        const names = r.ingredients.map((x) => x.name.toLowerCase());
        const matched = wanted.filter((w) => names.some((n) => n.includes(w))).length;
        return { ...r, matched, matchTotal: wanted.length };
      })
      .filter((r) => (matchAll ? r.matched === r.matchTotal : r.matched > 0));
  }

  if (maxTime) list = list.filter((r) => r.totalTime <= maxTime);
  if (difficulty) list = list.filter((r) => r.difficulty === difficulty);
  if (cuisine) list = list.filter((r) => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  if (mealType) list = list.filter((r) => r.mealType === mealType);
  if (diets.length) list = list.filter((r) => diets.every((d) => (r.tags || []).includes(d)));

  const sorters = {
    top: (a, b) => b.score - a.score || b.ups - a.ups,
    new: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    quick: (a, b) => a.totalTime - b.totalTime,
    match: (a, b) => (b.matched || 0) - (a.matched || 0) || b.score - a.score,
  };
  list.sort(sorters[sort] || sorters.top);
  return list;
}

export async function getRecipe(id) {
  await wait();
  const recipe = load('recipes').find((r) => r.id === id);
  if (!recipe) throw new Error('Recipe not found');
  return enrich(recipe, context());
}

export async function getRecipesByIds(ids = []) {
  await wait();
  const ctx = context();
  const byId = Object.fromEntries(load('recipes').map((r) => [r.id, r]));
  return ids.filter((id) => byId[id]).map((id) => enrich(byId[id], ctx));
}

export async function getFacets() {
  await wait(50);
  const cuisines = [...new Set(load('recipes').map((r) => r.cuisine))].sort();
  return { cuisines, mealTypes: MEAL_TYPES, diets: DIETS, difficulties: DIFFICULTIES };
}

export async function createRecipe(data, user) {
  await wait();
  requireCreator(user);
  const recipe = { ...sanitizeRecipe(data), id: uid('r'), authorId: user.id, createdAt: new Date().toISOString() };
  save('recipes', [recipe, ...load('recipes')]);
  return recipe;
}

export async function updateRecipe(id, data, user) {
  await wait();
  requireCreator(user);
  const recipes = load('recipes');
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Recipe not found');
  if (recipes[index].authorId !== user.id) throw new Error('You can only edit your own recipes.');
  recipes[index] = { ...recipes[index], ...sanitizeRecipe(data), updatedAt: new Date().toISOString() };
  save('recipes', recipes);
  return recipes[index];
}

export async function deleteRecipe(id, user) {
  await wait();
  requireCreator(user);
  const recipes = load('recipes');
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) throw new Error('Recipe not found');
  if (recipe.authorId !== user.id) throw new Error('You can only delete your own recipes.');
  save('recipes', recipes.filter((r) => r.id !== id));
  const votes = load('votes');
  delete votes[id];
  save('votes', votes);
  save('comments', load('comments').filter((c) => c.recipeId !== id));
}

/* ------------------------------ Votes ------------------------------ */

export async function getVoteSummary(recipeId, userId) {
  await wait(50);
  const votes = load('votes')[recipeId] || {};
  return { ...voteCounts(votes), myVote: (userId && votes[userId]) || 0 };
}

/** value: 1 (good) or -1 (bad). Voting the same way twice removes the vote. */
export async function vote(recipeId, userId, value) {
  await wait(150);
  if (!userId) throw new Error('Please log in to vote.');
  const votes = load('votes');
  const forRecipe = { ...(votes[recipeId] || {}) };
  if (forRecipe[userId] === value) delete forRecipe[userId];
  else forRecipe[userId] = value;
  votes[recipeId] = forRecipe;
  save('votes', votes);
  return { ...voteCounts(forRecipe), myVote: forRecipe[userId] || 0 };
}

/* ----------------------------- Comments ---------------------------- */

function withAuthor(comment, usersById) {
  const u = usersById[comment.userId];
  return { ...comment, author: u ? { id: u.id, name: u.name, avatar: u.avatar } : { id: comment.userId, name: 'Deleted user', avatar: '👤' } };
}

export async function getComments(recipeId) {
  await wait();
  const { usersById } = context();
  return load('comments')
    .filter((c) => c.recipeId === recipeId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => withAuthor(c, usersById));
}

export async function getCommentsByUser(userId) {
  await wait();
  const recipes = Object.fromEntries(load('recipes').map((r) => [r.id, r]));
  return load('comments')
    .filter((c) => c.userId === userId && recipes[c.recipeId])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({ ...c, recipe: { id: c.recipeId, title: recipes[c.recipeId].title, emoji: recipes[c.recipeId].emoji } }));
}

export async function addComment(recipeId, user, body) {
  await wait();
  requireUser(user);
  const text = body.trim();
  if (!text) throw new Error('Comment cannot be empty.');
  if (text.length > 1000) throw new Error('Comments are limited to 1000 characters.');
  const comment = { id: uid('c'), recipeId, userId: user.id, body: text, createdAt: new Date().toISOString() };
  save('comments', [...load('comments'), comment]);
  return comment;
}

export async function deleteComment(commentId, user) {
  await wait();
  requireUser(user);
  const comments = load('comments');
  const comment = comments.find((c) => c.id === commentId);
  if (!comment) throw new Error('Comment not found');
  const recipe = load('recipes').find((r) => r.id === comment.recipeId);
  const allowed = comment.userId === user.id || recipe?.authorId === user.id;
  if (!allowed) throw new Error('You cannot delete this comment.');
  save('comments', comments.filter((c) => c.id !== commentId));
}

/* ------------------------------ Users ------------------------------ */

export function currentUser() {
  const id = db.read('session');
  return id ? publicUser(load('users').find((u) => u.id === id)) : null;
}

export async function login(email, password) {
  await wait(300);
  const user = load('users').find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) throw new Error('Incorrect email or password.');
  db.write('session', user.id);
  return publicUser(user);
}

export async function register({ name, email, password, role }) {
  await wait(300);
  const users = load('users');
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const user = {
    id: uid('u'),
    name: name.trim(),
    email: email.trim(),
    password, // demo only — a real backend must hash passwords
    role: role === 'creator' ? 'creator' : 'user',
    avatar: role === 'creator' ? '🧑‍🍳' : '🙂',
    bio: '',
    favourites: [],
    joinedAt: new Date().toISOString(),
  };
  save('users', [...users, user]);
  db.write('session', user.id);
  return publicUser(user);
}

export function logout() {
  db.write('session', null);
}

export async function updateProfile(userId, changes) {
  await wait();
  const users = load('users');
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error('User not found');
  users[index] = { ...users[index], name: changes.name.trim() || users[index].name, bio: changes.bio.trim(), avatar: changes.avatar || users[index].avatar };
  save('users', users);
  return publicUser(users[index]);
}

export async function toggleFavourite(userId, recipeId) {
  await wait(100);
  const users = load('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Please log in to save recipes.');
  user.favourites = user.favourites.includes(recipeId)
    ? user.favourites.filter((id) => id !== recipeId)
    : [recipeId, ...user.favourites];
  save('users', users);
  return publicUser(user);
}

export async function getUser(id) {
  await wait();
  const user = load('users').find((u) => u.id === id);
  if (!user) throw new Error('User not found');
  return publicUser(user);
}

export async function getChefs() {
  await wait();
  const ctx = context();
  const recipes = load('recipes');
  return load('users')
    .filter((u) => u.role === 'creator')
    .map((u) => {
      const own = recipes.filter((r) => r.authorId === u.id);
      const likes = own.reduce((sum, r) => sum + voteCounts(ctx.votes[r.id]).ups, 0);
      return { ...publicUser(u), recipeCount: own.length, likes };
    })
    .sort((a, b) => b.likes - a.likes);
}

/** Wipes everything saved in the browser and reloads the demo data. */
export function resetDemoData() {
  db.clearAll();
  seed();
}
