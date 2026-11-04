import { useState } from 'react';
import { Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import RecipeGrid from '../components/RecipeGrid';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';

const QUICK_LINKS = [
  { label: '⏱ Under 30 min', to: '/recipes?time=30&sort=quick' },
  { label: '🥕 Vegetarian', to: '/recipes?diet=Vegetarian' },
  { label: '🍳 Breakfast', to: '/recipes?meal=Breakfast' },
  { label: '🍰 Desserts', to: '/recipes?meal=Dessert' },
  { label: '🇲🇲 Burmese', to: '/recipes?cuisine=Burmese' },
];

function Section({ title, subtitle, to, children }) {
  return (
    <section className="mb-5">
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <h2 className="h3 mb-0">{title}</h2>
          {subtitle && <p className="text-body-secondary mb-0">{subtitle}</p>}
        </div>
        <Link to={to} className="fw-semibold text-nowrap">
          See all →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [fridge, setFridge] = useState('');

  const top = useApi(() => api.getRecipes({ sort: 'top' }), []);
  const quick = useApi(() => api.getRecipes({ maxTime: 30, sort: 'top' }), []);
  const newest = useApi(() => api.getRecipes({ sort: 'new' }), []);

  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : '/recipes');
  };

  const searchFridge = (e) => {
    e.preventDefault();
    const items = fridge
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (items.length) navigate(`/recipes?ing=${encodeURIComponent(items.join(','))}&sort=match`);
  };

  return (
    <Container>
      {/* Hero */}
      <div className="bg-primary text-white rounded-4 p-4 p-md-5 mb-5 shadow">
        <Row className="align-items-center g-4">
          <Col lg={7}>
            <h1 className="display-5 fw-bold">Find your next favourite meal</h1>
            <p className="lead mb-4">Search recipes by name, ingredient or cooking time — and see what the community rates best.</p>
            <Form onSubmit={search} role="search">
              <InputGroup size="lg">
                <Form.Control
                  placeholder="Try “noodles”, “chicken” or “vegan”"
                  aria-label="Search recipes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" variant="dark">
                  Search
                </Button>
              </InputGroup>
            </Form>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {QUICK_LINKS.map((l) => (
                <Button key={l.to} as={Link} to={l.to} variant="outline-light" size="sm" className="rounded-pill">
                  {l.label}
                </Button>
              ))}
            </div>
          </Col>
          <Col lg={5} className="d-none d-lg-block text-center">
            <div className="display-1">🍜 🥗</div>
            <div className="display-1">🍛 🍰</div>
          </Col>
        </Row>
      </div>

      <Section title="Top rated" subtitle="The community’s favourites" to="/recipes?sort=top">
        <RecipeGrid recipes={(top.data || []).slice(0, 3)} loading={top.loading} skeletons={3} />
      </Section>

      {/* What can I cook? */}
      <Card className="shadow-sm mb-5 bg-success-subtle">
        <Card.Body className="p-4 p-md-5">
          <Row className="align-items-center g-3">
            <Col md={5}>
              <h2 className="h3">🧺 What can I cook?</h2>
              <p className="mb-0 text-body-secondary">Tell us what’s in your fridge and we’ll rank recipes by how many ingredients you already have.</p>
            </Col>
            <Col md={7}>
              <Form onSubmit={searchFridge}>
                <InputGroup size="lg">
                  <Form.Control
                    placeholder="eggs, tomatoes, garlic"
                    aria-label="Ingredients you have"
                    value={fridge}
                    onChange={(e) => setFridge(e.target.value)}
                  />
                  <Button type="submit" variant="success">
                    Find recipes
                  </Button>
                </InputGroup>
                <Form.Text>Separate ingredients with commas.</Form.Text>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Section title="Ready in 30 minutes" subtitle="For busy weeknights" to="/recipes?time=30&sort=quick">
        <RecipeGrid recipes={(quick.data || []).slice(0, 3)} loading={quick.loading} skeletons={3} />
      </Section>

      <Section title="Fresh from our chefs" subtitle="Newly added recipes" to="/recipes?sort=new">
        <RecipeGrid recipes={(newest.data || []).slice(0, 3)} loading={newest.loading} skeletons={3} />
      </Section>
    </Container>
  );
}
