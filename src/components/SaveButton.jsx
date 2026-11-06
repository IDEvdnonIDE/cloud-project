import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../services/api';
import Icon from './Icon';

/**
 * Save / unsave a recipe. Guests are sent to log in first.
 * `overlay` is the round icon-only version that sits on a recipe photo.
 */
export default function SaveButton({ recipe, overlay = false, className = '' }) {
  const { user, refresh } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const saved = Boolean(user?.favourites?.includes(recipe.id));

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setBusy(true);
    try {
      await api.toggleFavourite(user.id, recipe.id);
      refresh();
      notify(saved ? 'Removed from saved recipes' : 'Saved to your profile', saved ? 'secondary' : 'success');
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const label = saved ? `Remove ${recipe.title} from saved recipes` : `Save ${recipe.title}`;

  if (overlay) {
    return (
      <Button
        variant="dark"
        className={`btn-icon border-0 bg-dark bg-opacity-50 text-white ${className}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={label}
        title={saved ? 'Saved' : 'Save'}
      >
        <Icon name="bookmark" size={18} filled={saved} />
      </Button>
    );
  }

  return (
    <Button variant={saved ? 'primary' : 'outline-secondary'} className={`d-inline-flex align-items-center gap-2 ${className}`} onClick={toggle} disabled={busy} aria-pressed={saved}>
      <Icon name="bookmark" filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
