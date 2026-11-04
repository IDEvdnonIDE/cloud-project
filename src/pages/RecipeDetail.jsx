import { useState } from 'react';
import { Badge, Breadcrumb, Button, Card, Col, Container, Form, InputGroup, ListGroup, Modal, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import EmptyState from '../components/EmptyState';
import RecipeImage from '../components/RecipeImage';
import VoteButtons from '../components/VoteButtons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { difficultyBadge, formatDate, formatQty, formatTime } from '../utils/format';

function Stat({ label, value }) {
  return (
    <Col>
      <div className="border rounded-3 py-2 px-1 text-center bg-white h-100">
        <div className="small text-body-secondary">{label}</div>
        <div className="fw-semibold">{value}</div>
      </div>
    </Col>
  );
}

function CookMode({ recipe, show, onHide }) {
  const [step, setStep] = useState(0);
  const total = recipe.steps.length;
  const last = step === total - 1;

  return (
    <Modal show={show} onHide={onHide} onEnter={() => setStep(0)} fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>
          {recipe.emoji} {recipe.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex align-items-center">
        <Container className="text-center">
          <ProgressBar now={((step + 1) / total) * 100} className="mb-4" />
          <p className="text-uppercase fw-semibold text-body-secondary">
            Step {step + 1} of {total}
          </p>
          <p className="fs-2">{recipe.steps[step]}</p>
        </Container>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button size="lg" variant="outline-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← Previous
        </Button>
        {last ? (
          <Button size="lg" variant="success" onClick={onHide}>
            Done 🎉
          </Button>
        ) : (
          <Button size="lg" onClick={() => setStep((s) => s + 1)}>
            Next →
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

function RecipeView({ id }) {
  const { user, refresh } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: recipe, loading, error } = useApi(() => api.getRecipe(id), [id]);
  const [servings, setServings] = useState(null);
  const [checked, setChecked] = useState({});
  const [cookMode, setCookMode] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container>
        <EmptyState
          icon="🥄"
          title="Recipe not found"
          text="It may have been removed by its chef."
          action={
            <Button as={Link} to="/recipes">
              Browse recipes
            </Button>
          }
        />
      </Container>
    );
  }

  const current = servings ?? recipe.servings;
  const factor = current / recipe.servings;
  const isFavourite = Boolean(user?.favourites?.includes(recipe.id));
  const isOwner = user?.id === recipe.authorId;

  const toggleFavourite = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSaving(true);
    try {
      await api.toggleFavourite(user.id, recipe.id);
      refresh();
      notify(isFavourite ? 'Removed from saved recipes' : 'Saved to your profile', isFavourite ? 'secondary' : 'success');
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/recipes' }}>
          Recipes
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{recipe.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4 mb-4 align-items-center">
        <Col lg={6}>
          <RecipeImage recipe={recipe} className="rounded-4 shadow-sm" />
        </Col>
        <Col lg={6}>
          <div className="d-flex flex-wrap gap-1 mb-2">
            <Badge bg="dark">{recipe.cuisine}</Badge>
            <Badge bg="secondary">{recipe.mealType}</Badge>
            {recipe.tags.map((t) => (
              <Badge key={t} bg="success-subtle" text="success-emphasis">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="display-6 fw-bold">{recipe.title}</h1>
          <p className="lead text-body-secondary">{recipe.description}</p>
          <p>
            By{' '}
            <Link to={`/chefs/${recipe.author.id}`} className="fw-semibold">
              {recipe.author.avatar} {recipe.author.name}
            </Link>{' '}
            <span className="text-body-secondary">· {formatDate(recipe.createdAt)}</span>
          </p>

          <Row xs={2} sm={4} className="g-2 mb-4">
            <Stat label="Prep" value={formatTime(recipe.prepTime)} />
            <Stat label="Cook" value={formatTime(recipe.cookTime)} />
            <Stat label="Total" value={formatTime(recipe.totalTime)} />
            <Stat label="Difficulty" value={<Badge {...difficultyBadge(recipe.difficulty)}>{recipe.difficulty}</Badge>} />
          </Row>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <VoteButtons recipeId={recipe.id} ups={recipe.ups} downs={recipe.downs} />
            <Button variant={isFavourite ? 'danger' : 'outline-danger'} onClick={toggleFavourite} disabled={saving}>
              {isFavourite ? '♥ Saved' : '♡ Save'}
            </Button>
            <Button variant="outline-dark" onClick={() => setCookMode(true)}>
              👨‍🍳 Cook mode
            </Button>
            {isOwner && (
              <Button as={Link} to={`/dashboard/recipes/${recipe.id}/edit`} variant="outline-secondary">
                ✏️ Edit
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="py-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <h2 className="h5 mb-0">Ingredients</h2>
              <InputGroup size="sm" className="w-auto">
                <Button variant="outline-secondary" aria-label="Fewer servings" disabled={current <= 1} onClick={() => setServings(current - 1)}>
                  −
                </Button>
                <InputGroup.Text>
                  {current} serving{current === 1 ? '' : 's'}
                </InputGroup.Text>
                <Button variant="outline-secondary" aria-label="More servings" onClick={() => setServings(current + 1)}>
                  +
                </Button>
              </InputGroup>
            </Card.Header>
            <ListGroup variant="flush">
              {recipe.ingredients.map((ing, n) => (
                <ListGroup.Item key={n} className="py-2">
                  <Form.Check
                    id={`ingredient-${n}`}
                    checked={Boolean(checked[n])}
                    onChange={() => setChecked((c) => ({ ...c, [n]: !c[n] }))}
                    label={
                      <span className={checked[n] ? 'text-decoration-line-through text-body-secondary' : ''}>
                        {ing.qty !== null && (
                          <strong>
                            {formatQty(ing.qty * factor)} {ing.unit}{' '}
                          </strong>
                        )}
                        {ing.name}
                      </span>
                    }
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="py-3">
              <h2 className="h5 mb-0">Method</h2>
            </Card.Header>
            <ListGroup as="ol" variant="flush" numbered>
              {recipe.steps.map((s, n) => (
                <ListGroup.Item as="li" key={n} className="py-3">
                  {s}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <CommentSection recipe={recipe} />
        </Col>
      </Row>

      <CookMode recipe={recipe} show={cookMode} onHide={() => setCookMode(false)} />
    </Container>
  );
}

// Keying by id resets servings/checkboxes when moving between recipes.
export default function RecipeDetail() {
  const { id } = useParams();
  return <RecipeView key={id} id={id} />;
}
