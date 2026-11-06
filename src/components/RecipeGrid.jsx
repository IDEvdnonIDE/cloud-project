import { Col, Placeholder, Row } from 'react-bootstrap';
import RecipeCard from './RecipeCard';

/** Loading stand-in shaped like a RecipeCard: portrait photo, one title line, one meta line. */
export function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <Placeholder as="div" animation="glow" className="ratio rounded-2 overflow-hidden" style={{ '--bs-aspect-ratio': '133.333%' }}>
        <Placeholder className="w-100 h-100" />
      </Placeholder>
      <Placeholder as="div" animation="glow" className="mt-2">
        <Placeholder xs={9} /> <Placeholder xs={5} size="sm" />
      </Placeholder>
    </div>
  );
}

export default function RecipeGrid({ recipes = [], loading = false, skeletons = 8, lg = 4 }) {
  return (
    <Row xs={2} md={3} lg={lg} className="g-4">
      {loading
        ? Array.from({ length: skeletons }, (_, n) => (
            <Col key={n}>
              <SkeletonCard />
            </Col>
          ))
        : recipes.map((recipe) => (
            <Col key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Col>
          ))}
    </Row>
  );
}
