import { Card, Col, Placeholder, Row } from 'react-bootstrap';
import RecipeCard from './RecipeCard';

function SkeletonCard() {
  return (
    <Card className="h-100 shadow-sm" aria-hidden="true">
      <Placeholder as="div" animation="glow" className="ratio ratio-16x9">
        <Placeholder className="w-100 h-100 card-img-top" />
      </Placeholder>
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={8} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={12} /> <Placeholder xs={9} />
        </Placeholder>
      </Card.Body>
    </Card>
  );
}

export default function RecipeGrid({ recipes = [], loading = false, skeletons = 6, lg = 3 }) {
  return (
    <Row xs={1} sm={2} lg={lg} className="g-4">
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
