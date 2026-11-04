import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Container, Form, Offcanvas, Pagination, Row } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import RecipeGrid from '../components/RecipeGrid';
import SearchFilters from '../components/SearchFilters';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { PAGE_SIZE, SORT_OPTIONS } from '../utils/constants';

const list = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** All search state lives in the URL, so searches can be shared and bookmarked. */
function parseFilters(params) {
  const ingredients = list(params.get('ing'));
  return {
    q: params.get('q') || '',
    ingredients,
    matchAll: params.get('all') === '1',
    maxTime: Number(params.get('time')) || 0,
    difficulty: params.get('diff') || '',
    cuisine: params.get('cuisine') || '',
    mealType: params.get('meal') || '',
    diets: list(params.get('diet')),
    sort: params.get('sort') || (ingredients.length ? 'match' : 'top'),
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

function countActive(f) {
  return [f.q, f.ingredients.length, f.maxTime, f.difficulty, f.cuisine, f.mealType, f.diets.length].filter(Boolean).length;
}

export default function Recipes() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: facets } = useApi(() => api.getFacets(), []);
  const { data, loading, error } = useApi(() => api.getRecipes(filters), [filters]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      const v = Array.isArray(value) ? value.join(',') : value;
      if (v === '' || v === null || v === undefined || v === 0) next.delete(key);
      else next.set(key, String(v));
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: 'q' in changes });
  };

  const reset = () => {
    setParams({});
    setShowFilters(false);
  };

  const goToPage = (n) => {
    update({ page: n === 1 ? '' : n });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const results = data || [];
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = countActive(filters);

  const heading = filters.q ? `Results for “${filters.q}”` : filters.ingredients.length ? 'Recipes with your ingredients' : 'All recipes';

  return (
    <Container>
      <Row className="g-4">
        <Col lg={3}>
          <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} responsive="lg" placement="start">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Filters</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-block">
              <div className="bg-white rounded-3 shadow-sm p-lg-4 w-100">
                <SearchFilters filters={filters} facets={facets} onChange={update} onReset={reset} />
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        </Col>

        <Col lg={9}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h1 className="h3 mb-0">{heading}</h1>
              <small className="text-body-secondary">
                {loading ? 'Searching…' : `${results.length} recipe${results.length === 1 ? '' : 's'} found`}
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="d-lg-none" onClick={() => setShowFilters(true)}>
                Filters{' '}
                {active > 0 && (
                  <Badge bg="primary" pill>
                    {active}
                  </Badge>
                )}
              </Button>
              <Form.Select aria-label="Sort recipes" className="w-auto" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {filters.ingredients.length > 0 && <option value="match">Best ingredient match</option>}
              </Form.Select>
            </div>
          </div>

          {error && <Alert variant="danger">Something went wrong: {error.message}</Alert>}

          {!loading && results.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No recipes match"
              text="Try removing a filter or searching for something broader."
              action={
                <Button variant="outline-primary" onClick={reset}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <RecipeGrid recipes={pageItems} loading={loading} skeletons={6} />
          )}

          {!loading && totalPages > 1 && (
            <Pagination className="justify-content-center mt-5">
              <Pagination.Prev disabled={page === 1} onClick={() => goToPage(page - 1)} />
              {Array.from({ length: totalPages }, (_, n) => n + 1).map((n) => (
                <Pagination.Item key={n} active={n === page} onClick={() => goToPage(n)}>
                  {n}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page === totalPages} onClick={() => goToPage(page + 1)} />
            </Pagination>
          )}
        </Col>
      </Row>
    </Container>
  );
}
