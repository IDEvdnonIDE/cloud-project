import { useEffect, useRef, useState } from 'react';
import { Badge, Button, CloseButton, Form, InputGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { useDebounce } from '../hooks/useDebounce';
import { TIME_OPTIONS } from '../utils/constants';

/**
 * Filter panel. Reads the current `filters` and reports changes as
 * URL-param objects through `onChange`, e.g. onChange({ time: 30 }).
 */
export default function SearchFilters({ filters, facets, onChange, onReset }) {
  // Keyword box: keep a local value and push it to the URL after a pause.
  const [q, setQ] = useState(filters.q);
  const debouncedQ = useDebounce(q, 350);
  const pushed = useRef(filters.q);

  useEffect(() => {
    if (filters.q !== pushed.current) {
      pushed.current = filters.q;
      setQ(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    if (debouncedQ !== pushed.current) {
      pushed.current = debouncedQ;
      onChange({ q: debouncedQ });
    }
    // onChange is a new function on every parent render; the pushed.current
    // guard above stops that from sending the same query twice.
  }, [debouncedQ, onChange]);

  // Ingredient tags
  const [ingredientText, setIngredientText] = useState('');
  const addIngredients = () => {
    const parts = ingredientText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    onChange({ ing: [...new Set([...filters.ingredients, ...parts])] });
    setIngredientText('');
  };
  const removeIngredient = (name) => onChange({ ing: filters.ingredients.filter((x) => x !== name) });

  const toggleDiet = (diet) => {
    const next = filters.diets.includes(diet) ? filters.diets.filter((d) => d !== diet) : [...filters.diets, diet];
    onChange({ diet: next });
  };

  const label = 'small fw-semibold text-uppercase text-body-secondary';

  return (
    <Form onSubmit={(e) => e.preventDefault()} className="w-100">
      <Form.Group className="mb-4" controlId="filter-q">
        <Form.Label className={label}>Keyword</Form.Label>
        <Form.Control type="search" placeholder="Name, cuisine, tag…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Form.Group>

      <Form.Group className="mb-4" controlId="filter-ingredient">
        <Form.Label className={label}>Ingredients you have</Form.Label>
        <InputGroup>
          <Form.Control
            placeholder="e.g. chicken, garlic"
            value={ingredientText}
            onChange={(e) => setIngredientText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIngredients();
              }
            }}
          />
          <Button variant="outline-primary" onClick={addIngredients}>
            Add
          </Button>
        </InputGroup>
        {filters.ingredients.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mt-2">
            {filters.ingredients.map((name) => (
              <Badge key={name} pill bg="primary" className="d-inline-flex align-items-center gap-1 py-2 px-3">
                {name}
                <CloseButton variant="white" aria-label={`Remove ${name}`} onClick={() => removeIngredient(name)} />
              </Badge>
            ))}
          </div>
        )}
        {filters.ingredients.length > 1 && (
          <Form.Check
            type="switch"
            id="filter-match-all"
            className="mt-2 small"
            label="Must use all of them"
            checked={filters.matchAll}
            onChange={(e) => onChange({ all: e.target.checked ? '1' : '' })}
          />
        )}
      </Form.Group>

      <Form.Group className="mb-4" controlId="filter-time">
        <Form.Label className={label}>Total time</Form.Label>
        <Form.Select value={filters.maxTime} onChange={(e) => onChange({ time: Number(e.target.value) })}>
          {TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <div className="mb-4">
        <div className={`${label} mb-2`}>Difficulty</div>
        <ToggleButtonGroup type="radio" name="filter-difficulty" value={filters.difficulty} onChange={(v) => onChange({ diff: v })} className="w-100">
          <ToggleButton id="diff-any" value="" variant="outline-secondary" size="sm">
            Any
          </ToggleButton>
          {(facets?.difficulties || []).map((d) => (
            <ToggleButton key={d} id={`diff-${d}`} value={d} variant="outline-secondary" size="sm">
              {d}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <Form.Group className="mb-4" controlId="filter-cuisine">
        <Form.Label className={label}>Cuisine</Form.Label>
        <Form.Select value={filters.cuisine} onChange={(e) => onChange({ cuisine: e.target.value })}>
          <option value="">All cuisines</option>
          {(facets?.cuisines || []).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4" controlId="filter-meal">
        <Form.Label className={label}>Meal</Form.Label>
        <Form.Select value={filters.mealType} onChange={(e) => onChange({ meal: e.target.value })}>
          <option value="">Any meal</option>
          {(facets?.mealTypes || []).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <div className="mb-4">
        <div className={`${label} mb-2`}>Dietary</div>
        {(facets?.diets || []).map((d) => (
          <Form.Check key={d} id={`diet-${d}`} type="checkbox" label={d} checked={filters.diets.includes(d)} onChange={() => toggleDiet(d)} />
        ))}
      </div>

      <Button variant="outline-secondary" className="w-100" onClick={onReset}>
        Clear all filters
      </Button>
    </Form>
  );
}
