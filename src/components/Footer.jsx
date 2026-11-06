import { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resetDemoData } from '../services/api';
import ConfirmModal from './ConfirmModal';

const YEAR = new Date().getFullYear();

export default function Footer() {
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    resetDemoData();
    window.location.assign('/');
  };

  const links = [
    { to: '/recipes', label: 'Recipes' },
    { to: '/chefs', label: 'Chefs' },
    { to: '/', label: 'Help Centre'},
    { to: '/', label: 'Terms & Conditions'},
    { to: '/', label: 'Privacy Policy'}
  ];

  return (
    <footer className="border-top py-5 mt-6">
      <Container className="d-flex flex-column flex-md-row justify-content-between gap-4">
        <nav aria-label="Footer">
          <Link to="/" className="navbar-brand text-primary d-inline-block mb-2">
            Spoonful
          </Link>
          <ul className="list-unstyled mb-0">
            {links.map((l) => (
              <li key={l.to} className="mb-1">
                <Link to={l.to} className="text-reset">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="small text-body-secondary text-md-end align-self-md-end">
          <div>
            Demo mode: data is saved in your browser.{' '}
            <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => setConfirm(true)}>
              Reset demo data
            </Button>
          </div>
          <div>© {YEAR} Spoonful, a community recipe book</div>
        </div>
      </Container>
      <ConfirmModal show={confirm} title="Reset demo data?" confirmLabel="Reset" variant="warning" onConfirm={reset} onHide={() => setConfirm(false)}>
        This removes every account, recipe, vote and comment you have created and restores the original demo content.
      </ConfirmModal>
    </footer>
  );
}
