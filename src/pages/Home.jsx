import { useState } from 'react';
import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ScrollRow from '../components/ScrollRow';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import heroImage from '../assets/hero-1920.jpg';

const QUICK_LINKS = [
  { label: 'Under 30 min', to: '/recipes?time=30&sort=quick' },
  { label: 'Vegetarian', to: '/recipes?diet=Vegetarian' },
  { label: 'Breakfast', to: '/recipes?meal=Breakfast' },
  { label: 'Desserts', to: '/recipes?meal=Dessert' },
  { label: 'Burmese', to: '/recipes?cuisine=Burmese' },
];

const ROW_LENGTH = 10;

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
      <section className="hero position-relative overflow-hidden rounded-3 text-white d-flex align-items-center mb-6">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1280}
          fetchPriority="high"
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
        />
        <div className="photo-overlay position-absolute top-0 start-0 w-100 h-100" aria-hidden="true" />

        <div className="position-relative w-100 text-center px-3 py-5">
          <h1 className="display-4 mb-3">Find your next favourite meal</h1>
          <p className="hero-subtitle mb-4">Search by name, ingredient or cooking time.</p>
          <Form onSubmit={search} role="search" className="mx-auto" style={{ maxWidth: '36rem' }}>
            <InputGroup>
              <Form.Control
                className="rounded-start-pill ps-4"
                placeholder="Try “noodles”, “chicken” or “vegan”"
                aria-label="Search recipes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit">Search</Button>
            </InputGroup>
          </Form>
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
            {QUICK_LINKS.map((l) => (
              <Button key={l.to} as={Link} to={l.to} variant="outline-light" size="sm">
                {l.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <ScrollRow
        id="top-rated"
        title="Top rated"
        subtitle="The community’s favourites"
        to="/recipes?sort=top"
        recipes={(top.data || []).slice(0, ROW_LENGTH)}
        loading={top.loading}
        empty="No votes yet. Recipes appear here once people start rating them."
      />

      {/* Feature tile from design.md: solid primary, white text, 16px radius. */}
      <section className="bg-primary text-white rounded-3 p-4 p-md-5 mb-6" aria-labelledby="fridge-title">
        <Row className="align-items-center g-4">
          <Col md={5}>
            <h2 id="fridge-title" className="h3">
              What can I cook?
            </h2>
            <p className="mb-0">Tell us what’s in your fridge and we’ll rank recipes by how many ingredients you already have.</p>
          </Col>
          <Col md={7}>
            <Form onSubmit={searchFridge}>
              <InputGroup>
                <Form.Control
                  className="rounded-start-pill ps-4 border-0"
                  placeholder="eggs, tomatoes, garlic"
                  aria-label="Ingredients you have"
                  aria-describedby="fridge-help"
                  value={fridge}
                  onChange={(e) => setFridge(e.target.value)}
                />
                <Button type="submit" variant="dark">
                  Find recipes
                </Button>
              </InputGroup>
              <Form.Text id="fridge-help" className="text-white d-block mt-2 ps-3">
                Separate ingredients with commas.
              </Form.Text>
            </Form>
          </Col>
        </Row>
      </section>

      <ScrollRow
        id="quick"
        title="Ready in 30 minutes"
        subtitle="For busy weeknights"
        to="/recipes?time=30&sort=quick"
        recipes={(quick.data || []).slice(0, ROW_LENGTH)}
        loading={quick.loading}
        empty="No recipes under 30 minutes yet."
      />

      <ScrollRow
        id="newest"
        title="Fresh from our chefs"
        subtitle="Newly added recipes"
        to="/recipes?sort=new"
        recipes={(newest.data || []).slice(0, ROW_LENGTH)}
        loading={newest.loading}
        empty="No recipes yet. Chefs can publish one from their dashboard."
      />
    </Container>
  );
}
