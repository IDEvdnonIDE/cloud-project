import { useEffect, useState } from 'react';
import { Alert, Button, ButtonGroup, Card, CloseButton, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { DIETS, DIFFICULTIES, EMOJIS, MEAL_TYPES, UNITS } from '../utils/constants';
import { uid } from '../utils/format';

const MAX_IMAGE_BYTES = 800 * 1024;

const newIngredient = () => ({ key: uid('i'), qty: '', unit: '', name: '' });
const newStep = (text = '') => ({ key: uid('s'), text });

const emptyForm = () => ({
  title: '',
  description: '',
  emoji: '🍲',
  image: '',
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  difficulty: 'Easy',
  cuisine: '',
  mealType: 'Dinner',
  tags: [],
  ingredients: [newIngredient()],
  steps: [newStep()],
});

function fromRecipe(r) {
  return {
    ...emptyForm(),
    title: r.title,
    description: r.description,
    emoji: r.emoji,
    image: r.image || '',
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    servings: r.servings,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    mealType: r.mealType,
    tags: r.tags || [],
    ingredients: r.ingredients.map((x) => ({ key: uid('i'), qty: x.qty ?? '', unit: x.unit || '', name: x.name })),
    steps: r.steps.map((s) => newStep(s)),
  };
}

function validate(form) {
  const errors = {};
  if (form.title.trim().length < 3) errors.title = 'Give your recipe a title (at least 3 characters).';
  if (form.description.trim().length < 10) errors.description = 'Add a short description (at least 10 characters).';
  if (!form.cuisine.trim()) errors.cuisine = 'Please enter a cuisine.';
  if (Number(form.prepTime) < 0) errors.prepTime = 'Cannot be negative.';
  if (Number(form.cookTime) < 0) errors.cookTime = 'Cannot be negative.';
  if (Number(form.prepTime) + Number(form.cookTime) <= 0) errors.prepTime = 'Total time must be more than 0.';
  if (!(Number(form.servings) >= 1)) errors.servings = 'At least 1 serving.';
  if (!form.ingredients.some((i) => i.name.trim())) errors.ingredients = 'Add at least one ingredient.';
  if (!form.steps.some((s) => s.text.trim())) errors.steps = 'Add at least one step.';
  return errors;
}

export default function RecipeEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const { data: facets } = useApi(() => api.getFacets(), []);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .getRecipe(id)
      .then((r) => {
        if (r.authorId !== user.id) setLoadError('You can only edit your own recipes.');
        else setForm(fromRecipe(r));
      })
      .catch(() => setLoadError('Recipe not found.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, user.id]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const field = (name) => (e) => set(name, e.target.value);

  // Ingredients
  const updateIngredient = (key, prop, value) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((x) => (x.key === key ? { ...x, [prop]: value } : x)) }));
  const addIngredient = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, newIngredient()] }));
  const removeIngredient = (key) => setForm((f) => ({ ...f, ingredients: f.ingredients.filter((x) => x.key !== key) }));

  // Steps
  const updateStep = (key, text) => setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.key === key ? { ...s, text } : s)) }));
  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, newStep()] }));
  const removeStep = (key) => setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.key !== key) }));
  const moveStep = (index, dir) =>
    setForm((f) => {
      const steps = [...f.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return f;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...f, steps };
    });

  const toggleTag = (tag) => set('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]);

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, image: 'Please choose an image file.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((er) => ({ ...er, image: 'Please choose an image under 800 KB (images are stored in your browser).' }));
      e.target.value = '';
      return;
    }
    setErrors((er) => ({ ...er, image: undefined }));
    const reader = new FileReader();
    reader.onload = () => set('image', reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      notify('Please fix the highlighted fields', 'danger');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, steps: form.steps.map((s) => s.text) };
      const saved = isEdit ? await api.updateRecipe(id, payload, user) : await api.createRecipe(payload, user);
      notify(isEdit ? 'Recipe updated' : 'Recipe published 🎉');
      navigate(`/recipes/${saved.id}`);
    } catch (err) {
      notify(err.message, 'danger');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container>
        <EmptyState
          icon="🚫"
          title={loadError}
          action={
            <Button as={Link} to="/dashboard">
              Back to dashboard
            </Button>
          }
        />
      </Container>
    );
  }

  const preview = {
    ...form,
    id: 'preview',
    totalTime: (Number(form.prepTime) || 0) + (Number(form.cookTime) || 0),
    ups: 0,
    commentCount: 0,
    author: { id: user.id, name: user.name, avatar: user.avatar },
  };

  return (
    <Container>
      <h1 className="h3 mb-4">{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
      <Form noValidate onSubmit={submit}>
        <Row className="g-4">
          <Col lg={8}>
            {/* Basics */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="py-3">
                <h2 className="h5 mb-0">1. The basics</h2>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3" controlId="recipe-title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control value={form.title} onChange={field('title')} maxLength={80} isInvalid={!!errors.title} placeholder="e.g. Grandma’s chicken curry" />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="recipe-description">
                  <Form.Label>Short description</Form.Label>
                  <Form.Control as="textarea" rows={2} maxLength={250} value={form.description} onChange={field('description')} isInvalid={!!errors.description} />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="recipe-image">
                  <Form.Label>Photo (optional)</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={onImage} isInvalid={!!errors.image} />
                  <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                  {form.image && (
                    <Button variant="link" size="sm" className="px-0 text-danger" onClick={() => set('image', '')}>
                      Remove photo
                    </Button>
                  )}
                </Form.Group>
                <div>
                  <Form.Label>{form.image ? 'Icon (used when the photo is removed)' : 'Or pick an icon'}</Form.Label>
                  <div className="d-flex flex-wrap gap-1">
                    {EMOJIS.map((em) => (
                      <Button key={em} size="sm" variant={form.emoji === em ? 'primary' : 'outline-secondary'} className="fs-5 lh-1" onClick={() => set('emoji', em)} aria-label={`Icon ${em}`}>
                        {em}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Details */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="py-3">
                <h2 className="h5 mb-0">2. Details</h2>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-prep">
                    <Form.Label>Prep time (min)</Form.Label>
                    <Form.Control type="number" min={0} value={form.prepTime} onChange={field('prepTime')} isInvalid={!!errors.prepTime} />
                    <Form.Control.Feedback type="invalid">{errors.prepTime}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-cook">
                    <Form.Label>Cook time (min)</Form.Label>
                    <Form.Control type="number" min={0} value={form.cookTime} onChange={field('cookTime')} isInvalid={!!errors.cookTime} />
                    <Form.Control.Feedback type="invalid">{errors.cookTime}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-servings">
                    <Form.Label>Servings</Form.Label>
                    <Form.Control type="number" min={1} value={form.servings} onChange={field('servings')} isInvalid={!!errors.servings} />
                    <Form.Control.Feedback type="invalid">{errors.servings}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-difficulty">
                    <Form.Label>Difficulty</Form.Label>
                    <Form.Select value={form.difficulty} onChange={field('difficulty')}>
                      {DIFFICULTIES.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-cuisine">
                    <Form.Label>Cuisine</Form.Label>
                    <Form.Control list="cuisine-options" value={form.cuisine} onChange={field('cuisine')} isInvalid={!!errors.cuisine} placeholder="e.g. Burmese" />
                    <datalist id="cuisine-options">
                      {(facets?.cuisines || []).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <Form.Control.Feedback type="invalid">{errors.cuisine}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} xs={6} md={4} controlId="recipe-meal">
                    <Form.Label>Meal</Form.Label>
                    <Form.Select value={form.mealType} onChange={field('mealType')}>
                      {MEAL_TYPES.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Col xs={12}>
                    <Form.Label className="d-block">Dietary tags</Form.Label>
                    {DIETS.map((d) => (
                      <Form.Check inline key={d} id={`tag-${d}`} type="checkbox" label={d} checked={form.tags.includes(d)} onChange={() => toggleTag(d)} />
                    ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Ingredients */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="py-3">
                <h2 className="h5 mb-0">3. Ingredients</h2>
              </Card.Header>
              <Card.Body>
                {errors.ingredients && <Alert variant="danger" className="py-2">{errors.ingredients}</Alert>}
                <datalist id="unit-options">
                  {UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
                {form.ingredients.map((ing, n) => (
                  <Row key={ing.key} className="g-2 mb-2 align-items-center">
                    <Col xs={3} md={2}>
                      <Form.Control type="number" min={0} step="any" placeholder="Qty" aria-label={`Quantity for ingredient ${n + 1}`} value={ing.qty} onChange={(e) => updateIngredient(ing.key, 'qty', e.target.value)} />
                    </Col>
                    <Col xs={3} md={2}>
                      <Form.Control list="unit-options" placeholder="Unit" aria-label={`Unit for ingredient ${n + 1}`} value={ing.unit} onChange={(e) => updateIngredient(ing.key, 'unit', e.target.value)} />
                    </Col>
                    <Col>
                      <Form.Control placeholder="Ingredient, e.g. garlic" aria-label={`Ingredient ${n + 1}`} value={ing.name} onChange={(e) => updateIngredient(ing.key, 'name', e.target.value)} />
                    </Col>
                    <Col xs="auto">
                      <CloseButton aria-label={`Remove ingredient ${n + 1}`} disabled={form.ingredients.length === 1} onClick={() => removeIngredient(ing.key)} />
                    </Col>
                  </Row>
                ))}
                <Button variant="outline-primary" size="sm" className="mt-2" onClick={addIngredient}>
                  + Add ingredient
                </Button>
                <Form.Text className="d-block mt-2">Leave quantity empty for things like “salt, to taste”.</Form.Text>
              </Card.Body>
            </Card>

            {/* Steps */}
            <Card className="shadow-sm">
              <Card.Header className="py-3">
                <h2 className="h5 mb-0">4. Method</h2>
              </Card.Header>
              <Card.Body>
                {errors.steps && <Alert variant="danger" className="py-2">{errors.steps}</Alert>}
                {form.steps.map((step, n) => (
                  <div key={step.key} className="d-flex gap-2 mb-3">
                    <div className="fw-bold text-primary pt-2">{n + 1}.</div>
                    <Form.Control as="textarea" rows={2} placeholder="Describe this step…" aria-label={`Step ${n + 1}`} value={step.text} onChange={(e) => updateStep(step.key, e.target.value)} />
                    <ButtonGroup vertical size="sm">
                      <Button variant="outline-secondary" disabled={n === 0} onClick={() => moveStep(n, -1)} aria-label={`Move step ${n + 1} up`}>
                        ↑
                      </Button>
                      <Button variant="outline-secondary" disabled={n === form.steps.length - 1} onClick={() => moveStep(n, 1)} aria-label={`Move step ${n + 1} down`}>
                        ↓
                      </Button>
                      <Button variant="outline-danger" disabled={form.steps.length === 1} onClick={() => removeStep(step.key)} aria-label={`Remove step ${n + 1}`}>
                        ✕
                      </Button>
                    </ButtonGroup>
                  </div>
                ))}
                <Button variant="outline-primary" size="sm" onClick={addStep}>
                  + Add step
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Preview + actions */}
          <Col lg={4}>
            <div className="small fw-semibold text-uppercase text-body-secondary mb-2">Live preview</div>
            <div>
              <RecipeCard recipe={preview} linkable={false} />
            </div>
            <div className="d-grid gap-2 mt-4">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish recipe'}
              </Button>
              <Button as={Link} to={isEdit ? `/recipes/${id}` : '/dashboard'} variant="outline-secondary">
                Cancel
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
