import { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { resetDemoData } from '../services/api';
import ConfirmModal from './ConfirmModal';

export default function Footer() {
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    resetDemoData();
    window.location.assign('/');
  };

  return (
    <footer className="bg-dark text-white-50 py-4 mt-5">
      <Container className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 small">
        <span>© {new Date().getFullYear()} Spoonful · a community recipe book</span>
        <span>
          Demo mode: data is saved in your browser.{' '}
          <Button variant="link" size="sm" className="p-0 align-baseline text-white" onClick={() => setConfirm(true)}>
            Reset demo data
          </Button>
        </span>
      </Container>
      <ConfirmModal show={confirm} title="Reset demo data?" confirmLabel="Reset" variant="warning" onConfirm={reset} onHide={() => setConfirm(false)}>
        This removes every account, recipe, vote and comment you have created and restores the original demo content.
      </ConfirmModal>
    </footer>
  );
}
