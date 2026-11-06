import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <Container>
      <EmptyState
        icon="🍳"
        title="Page not found"
        text="This page seems to have burnt. Let’s get you back to the kitchen."
        action={
          <Button as={Link} to="/">
            Go home
          </Button>
        }
      />
    </Container>
  );
}
