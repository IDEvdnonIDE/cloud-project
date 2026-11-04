import { Button, Card, Container, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import RecipeGrid from '../components/RecipeGrid';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { formatDate } from '../utils/format';

export default function ChefProfile() {
  const { id } = useParams();
  const chef = useApi(() => api.getUser(id), [id]);
  const recipes = useApi(() => api.getRecipes({ authorId: id, sort: 'top' }), [id]);

  if (chef.loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (chef.error || chef.data?.role !== 'creator') {
    return (
      <Container>
        <EmptyState
          icon="🧑‍🍳"
          title="Chef not found"
          action={
            <Button as={Link} to="/chefs">
              See all chefs
            </Button>
          }
        />
      </Container>
    );
  }

  const list = recipes.data || [];
  const likes = list.reduce((s, r) => s + r.ups, 0);

  return (
    <Container>
      <Card className="shadow-sm mb-5 bg-primary-subtle">
        <Card.Body className="d-flex flex-column flex-md-row align-items-md-center gap-4 p-4 p-md-5">
          <div className="display-1 lh-1">{chef.data.avatar}</div>
          <div>
            <h1 className="display-6 fw-bold mb-1">{chef.data.name}</h1>
            {chef.data.bio && <p className="lead mb-2">{chef.data.bio}</p>}
            <div className="text-body-secondary">
              📖 {list.length} recipes · 👍 {likes} likes · Cooking since {formatDate(chef.data.joinedAt)}
            </div>
          </div>
        </Card.Body>
      </Card>

      <h2 className="h4 mb-3">Recipes by {chef.data.name}</h2>
      {!recipes.loading && list.length === 0 ? (
        <EmptyState icon="📝" title="No recipes yet" text="Check back soon!" />
      ) : (
        <RecipeGrid recipes={list} loading={recipes.loading} skeletons={3} />
      )}
    </Container>
  );
}
