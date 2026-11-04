import { Button, Container } from 'react-bootstrap';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmptyState from './EmptyState';

/** Redirects guests to /login; shows a message if the user's role isn't allowed. */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <Container>
        <EmptyState
          icon="🔒"
          title="Chefs only"
          text="This area is for recipe creators. Create a chef account to start sharing your own recipes."
          action={
            <Button as={Link} to="/">
              Back to home
            </Button>
          }
        />
      </Container>
    );
  }

  return children;
}
