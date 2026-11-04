import { useState } from 'react';
import { Button, ButtonGroup, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { formatDate } from '../utils/format';

function StatCard({ label, value, icon }) {
  return (
    <Col>
      <Card className="shadow-sm h-100">
        <Card.Body>
          <div className="text-body-secondary small">
            {icon} {label}
          </div>
          <div className="fs-2 fw-bold">{value}</div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const { data, loading, reload } = useApi(() => api.getRecipes({ authorId: user.id, sort: 'new' }), [user.id]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const recipes = data || [];
  const ups = recipes.reduce((s, r) => s + r.ups, 0);
  const downs = recipes.reduce((s, r) => s + r.downs, 0);
  const comments = recipes.reduce((s, r) => s + r.commentCount, 0);
  const liked = ups + downs ? `${Math.round((ups / (ups + downs)) * 100)}%` : '—';

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteRecipe(toDelete.id, user);
      notify(`Deleted “${toDelete.title}”`, 'secondary');
      setToDelete(null);
      reload();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 mb-0">Chef dashboard</h1>
          <span className="text-body-secondary">Manage your recipes and see how they’re doing.</span>
        </div>
        <Button as={Link} to="/dashboard/recipes/new" size="lg">
          + New recipe
        </Button>
      </div>

      <Row xs={2} md={4} className="g-3 mb-4">
        <StatCard icon="📖" label="Recipes" value={recipes.length} />
        <StatCard icon="👍" label="Likes" value={ups} />
        <StatCard icon="💬" label="Comments" value={comments} />
        <StatCard icon="⭐" label="Liked by" value={liked} />
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="py-3">
          <h2 className="h5 mb-0">My recipes</h2>
        </Card.Header>
        {loading && !data ? (
          <Card.Body className="text-center">
            <Spinner animation="border" size="sm" />
          </Card.Body>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="You haven’t published anything yet"
            text="Share your first recipe with the community."
            action={
              <Button as={Link} to="/dashboard/recipes/new">
                Create a recipe
              </Button>
            }
          />
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Recipe</th>
                <th className="d-none d-md-table-cell">Published</th>
                <th className="text-center">👍</th>
                <th className="text-center">👎</th>
                <th className="text-center">💬</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/recipes/${r.id}`} className="fw-semibold text-reset">
                      {r.emoji} {r.title}
                    </Link>
                    <div className="small text-body-secondary">
                      {r.cuisine} · {r.difficulty}
                    </div>
                  </td>
                  <td className="d-none d-md-table-cell text-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="text-center">{r.ups}</td>
                  <td className="text-center">{r.downs}</td>
                  <td className="text-center">{r.commentCount}</td>
                  <td className="text-end">
                    <ButtonGroup size="sm">
                      <Button as={Link} to={`/dashboard/recipes/${r.id}/edit`} variant="outline-secondary">
                        Edit
                      </Button>
                      <Button variant="outline-danger" onClick={() => setToDelete(r)}>
                        Delete
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ConfirmModal show={Boolean(toDelete)} title="Delete recipe?" busy={deleting} onConfirm={confirmDelete} onHide={() => setToDelete(null)}>
        “{toDelete?.title}” and all of its votes and comments will be removed permanently.
      </ConfirmModal>
    </Container>
  );
}
