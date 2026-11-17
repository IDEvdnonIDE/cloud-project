// Firestore-backed API for Spoonful.
// Function signatures match the old localStorage mock so components
// that `import * as api` keep working without changes.
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, where, writeBatch, increment, documentId,
} from 'firebase/firestore';
import { MEAL_TYPES, DIETS, DIFFICULTIES } from '../utils/constants';

/* ----------------------------- Helpers ----------------------------- */

const recipesCol = collection(db, 'recipes');
const votesCol   = collection(db, 'votes');
const commentsCol = collection(db, 'comments');
const usersCol   = collection(db, 'users');

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

/**
 * Fetch user docs for a set of UIDs, returned as { uid: {id, name, avatar} }.
 * Uses batched `in` queries (max 30 IDs per query).
 */
async function fetchAuthors(uids) {
  const unique = [...new Set(uids.filter(Boolean))];
  if (!unique.length) return {};
  const map = {};
  for (let i = 0; i < unique.length; i += 30) {
    const batch = unique.slice(i, i + 30);
    const snap = await getDocs(query(usersCol, where(documentId(), 'in', batch)));
    snap.forEach((d) => {
      const u = d.data();
      map[d.id] = { id: d.id, name: u.name, avatar: u.avatar };
    });
  }
  return map;
}

/** Attach computed fields (totalTime, score) and author info to a recipe doc. */
function enrich(recipe, authors) {
  const ups = recipe.ups || 0;
  const downs = recipe.downs || 0;
  return {
    ...recipe,
    totalTime: (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0),
    ups,
    downs,
    score: ups - downs,
    commentCount: recipe.commentCount || 0,
    author: authors[recipe.authorId] || { id: recipe.authorId, name: 'Unknown chef', avatar: '🧑‍🍳' },
  };
}

/* ----------------------------- Recipes ----------------------------- */

export async function getRecipes(filters = {}) {
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

  // Fetch all recipes then filter client-side (dataset is small)
  const snap = await getDocs(recipesCol);
  const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const authors = await fetchAuthors(raw.map((r) => r.authorId));
  let list = raw.map((r) => enrich(r, authors));

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
  const snap = await getDoc(doc(db, 'recipes', id));
  if (!snap.exists()) throw new Error('Recipe not found');
  const recipe = { id: snap.id, ...snap.data() };
  const authors = await fetchAuthors([recipe.authorId]);
  return enrich(recipe, authors);
}

export async function getRecipesByIds(ids = []) {
  if (!ids.length) return [];
  const results = [];
  // Firestore `in` supports up to 30 values per query
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(query(recipesCol, where(documentId(), 'in', chunk)));
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
  }
  const authors = await fetchAuthors(results.map((r) => r.authorId));
  // Return in the same order as the input ids, skip missing
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  return ids.filter((id) => byId[id]).map((id) => enrich(byId[id], authors));
}

export async function getFacets() {
  const snap = await getDocs(recipesCol);
  const cuisines = [...new Set(snap.docs.map((d) => d.data().cuisine))].sort();
  return { cuisines, mealTypes: MEAL_TYPES, diets: DIETS, difficulties: DIFFICULTIES };
}

export async function createRecipe(data, user) {
  requireCreator(user);
  const id = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const recipe = {
    ...sanitizeRecipe(data),
    authorId: user.id,
    createdAt: new Date().toISOString(),
    ups: 0,
    downs: 0,
    commentCount: 0,
  };
  await setDoc(doc(db, 'recipes', id), recipe);
  return { id, ...recipe };
}

export async function updateRecipe(id, data, user) {
  requireCreator(user);
  const snap = await getDoc(doc(db, 'recipes', id));
  if (!snap.exists()) throw new Error('Recipe not found');
  const existing = snap.data();
  if (existing.authorId !== user.id) throw new Error('You can only edit your own recipes.');
  const updated = { ...sanitizeRecipe(data), updatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'recipes', id), updated, { merge: true });
  return { id, ...existing, ...updated };
}

export async function deleteRecipe(id, user) {
  requireCreator(user);
  const snap = await getDoc(doc(db, 'recipes', id));
  if (!snap.exists()) throw new Error('Recipe not found');
  if (snap.data().authorId !== user.id) throw new Error('You can only delete your own recipes.');

  const batch = writeBatch(db);

  // Cascade: remove all votes and comments for this recipe
  const votesSnap = await getDocs(query(votesCol, where('recipeId', '==', id)));
  votesSnap.forEach((d) => batch.delete(d.ref));

  const commentsSnap = await getDocs(query(commentsCol, where('recipeId', '==', id)));
  commentsSnap.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db, 'recipes', id));
  await batch.commit();
}

/* ------------------------------ Votes ------------------------------ */

/**
 * Each vote is a document in the `votes` collection with ID `{recipeId}_{userId}`
 * and fields { recipeId, userId, value }.
 * Aggregate counts (ups, downs) are denormalized on the recipe document and
 * updated atomically via writeBatch + increment.
 */

export async function getVoteSummary(recipeId, userId) {
  const recipeSnap = await getDoc(doc(db, 'recipes', recipeId));
  const data = recipeSnap.exists() ? recipeSnap.data() : {};
  let myVote = 0;
  if (userId) {
    const voteSnap = await getDoc(doc(db, 'votes', `${recipeId}_${userId}`));
    myVote = voteSnap.exists() ? voteSnap.data().value : 0;
  }
  return { ups: data.ups || 0, downs: data.downs || 0, myVote };
}

/** value: 1 (good) or -1 (bad). Voting the same way twice removes the vote. */
export async function vote(recipeId, userId, value) {
  if (!userId) throw new Error('Please log in to vote.');

  const voteRef = doc(db, 'votes', `${recipeId}_${userId}`);
  const recipeRef = doc(db, 'recipes', recipeId);
  const voteSnap = await getDoc(voteRef);

  const batch = writeBatch(db);

  if (voteSnap.exists()) {
    const oldValue = voteSnap.data().value;
    if (oldValue === value) {
      // Same vote again → toggle off
      batch.delete(voteRef);
      batch.update(recipeRef, { [oldValue === 1 ? 'ups' : 'downs']: increment(-1) });
    } else {
      // Switching direction (up↔down)
      batch.set(voteRef, { recipeId, userId, value });
      batch.update(recipeRef, {
        [oldValue === 1 ? 'ups' : 'downs']: increment(-1),
        [value === 1 ? 'ups' : 'downs']: increment(1),
      });
    }
  } else {
    // New vote
    batch.set(voteRef, { recipeId, userId, value });
    batch.update(recipeRef, { [value === 1 ? 'ups' : 'downs']: increment(1) });
  }

  await batch.commit();

  // Read back updated state
  const updatedRecipe = await getDoc(recipeRef);
  const rd = updatedRecipe.data();
  const updatedVote = await getDoc(voteRef);
  return {
    ups: rd.ups || 0,
    downs: rd.downs || 0,
    myVote: updatedVote.exists() ? updatedVote.data().value : 0,
  };
}

/* ----------------------------- Comments ---------------------------- */

export async function getComments(recipeId) {
  const snap = await getDocs(query(commentsCol, where('recipeId', '==', recipeId)));
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const authors = await fetchAuthors(comments.map((c) => c.userId));
  return comments.map((c) => ({
    ...c,
    author: authors[c.userId] || { id: c.userId, name: 'Deleted user', avatar: '👤' },
  }));
}

export async function getCommentsByUser(userId) {
  const snap = await getDocs(query(commentsCol, where('userId', '==', userId)));
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Attach recipe title/emoji to each comment
  const recipeIds = [...new Set(comments.map((c) => c.recipeId))];
  const recipeMap = {};
  for (let i = 0; i < recipeIds.length; i += 30) {
    const chunk = recipeIds.slice(i, i + 30);
    const rSnap = await getDocs(query(recipesCol, where(documentId(), 'in', chunk)));
    rSnap.forEach((d) => { recipeMap[d.id] = d.data(); });
  }

  return comments
    .filter((c) => recipeMap[c.recipeId])
    .map((c) => ({
      ...c,
      recipe: { id: c.recipeId, title: recipeMap[c.recipeId].title, emoji: recipeMap[c.recipeId].emoji },
    }));
}

export async function addComment(recipeId, user, body) {
  requireUser(user);
  const text = body.trim();
  if (!text) throw new Error('Comment cannot be empty.');
  if (text.length > 1000) throw new Error('Comments are limited to 1000 characters.');

  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const comment = { recipeId, userId: user.id, body: text, createdAt: new Date().toISOString() };

  const batch = writeBatch(db);
  batch.set(doc(db, 'comments', id), comment);
  batch.update(doc(db, 'recipes', recipeId), { commentCount: increment(1) });
  await batch.commit();

  return { id, ...comment };
}

export async function deleteComment(commentId, user) {
  requireUser(user);
  const snap = await getDoc(doc(db, 'comments', commentId));
  if (!snap.exists()) throw new Error('Comment not found');
  const comment = snap.data();

  const recipeSnap = await getDoc(doc(db, 'recipes', comment.recipeId));
  const recipe = recipeSnap.exists() ? recipeSnap.data() : null;
  const allowed = comment.userId === user.id || recipe?.authorId === user.id;
  if (!allowed) throw new Error('You cannot delete this comment.');

  const batch = writeBatch(db);
  batch.delete(doc(db, 'comments', commentId));
  if (recipeSnap.exists()) {
    batch.update(doc(db, 'recipes', comment.recipeId), { commentCount: increment(-1) });
  }
  await batch.commit();
}

/* ------------------------------ Users ------------------------------ */

export async function getUser(id) {
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) throw new Error('User not found');
  return { id: snap.id, ...snap.data() };
}

export async function getChefs() {
  const snap = await getDocs(query(usersCol, where('role', '==', 'creator')));
  const chefs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Count recipes and total likes per chef
  const recipesSnap = await getDocs(recipesCol);
  const recipes = recipesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return chefs
    .map((u) => {
      const own = recipes.filter((r) => r.authorId === u.id);
      const likes = own.reduce((sum, r) => sum + (r.ups || 0), 0);
      return { ...u, recipeCount: own.length, likes };
    })
    .sort((a, b) => b.likes - a.likes);
}

export async function toggleFavourite(userId, recipeId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('Please log in to save recipes.');
  const favs = snap.data().favourites || [];

  const updated = favs.includes(recipeId)
    ? favs.filter((id) => id !== recipeId)
    : [recipeId, ...favs];

  await setDoc(userRef, { favourites: updated }, { merge: true });

  const refreshed = await getDoc(userRef);
  return { id: userId, ...refreshed.data() };
}

// Auth functions — kept as stubs for backward compatibility.
// Real authentication is handled entirely by AuthContext + Firebase Auth.
export function currentUser() { return null; }
export async function login() { throw new Error('Use AuthContext for login.'); }
export async function register() { throw new Error('Use AuthContext for registration.'); }
export function logout() { /* handled by AuthContext */ }
export async function updateProfile() { throw new Error('Use AuthContext saveProfile.'); }

/** No-op: demo data lives in Firestore now, not localStorage. */
export function resetDemoData() {
  console.warn('resetDemoData: demo data is in Firestore, not localStorage.');
}