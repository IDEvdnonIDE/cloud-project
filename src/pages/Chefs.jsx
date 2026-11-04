import { Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { truncate } from '../utils/format';

export default function Chefs() {
  const { data, loading } = useApi(() => api.getChefs(), []);

  return (
    <Container>
      <h1 className="h3 mb-1">Our chefs</h1>
      <p className="text-body-secondary mb-4">The cooks sharing recipes on Spoonful.</p>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-4">
          {data.map((chef) => (
            <Col key={chef.id}>
              <Card className="shadow-sm h-100 text-center">
                <Card.Body className="p-4">
                  <div className="display-3 mb-2">{chef.avatar}</div>
                  <Card.Title as="h2" className="h5">
                    <Link to={`/chefs/${chef.id}`} className="stretched-link text-reset text-decoration-none">
                      {chef.name}
                    </Link>
                  </Card.Title>
                  <Card.Text className="text-body-secondary small">{truncate(chef.bio || 'Home cook on Spoonful.', 110)}</Card.Text>
                </Card.Body>
                <Card.Footer className="small text-body-secondary">
                  📖 {chef.recipeCount} recipe{chef.recipeCount === 1 ? '' : 's'} · 👍 {chef.likes} likes
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
