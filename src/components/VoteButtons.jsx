import { useEffect, useState } from 'react';
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../services/api';

// Predict the result of a vote so the UI updates instantly.
function applyVote({ ups, downs, myVote }, value) {
  let u = ups;
  let d = downs;
  if (myVote === 1) u -= 1;
  if (myVote === -1) d -= 1;
  const next = myVote === value ? 0 : value;
  if (next === 1) u += 1;
  if (next === -1) d += 1;
  return { ups: u, downs: d, myVote: next };
}

export default function VoteButtons({ recipeId, ups = 0, downs = 0 }) {
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [votes, setVotes] = useState({ ups, downs, myVote: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.getVoteSummary(recipeId, user?.id).then((summary) => active && setVotes(summary));
    return () => {
      active = false;
    };
  }, [recipeId, user?.id]);

  const cast = async (value) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const previous = votes;
    setVotes(applyVote(previous, value));
    setBusy(true);
    try {
      setVotes(await api.vote(recipeId, user.id, value));
    } catch (err) {
      setVotes(previous);
      notify(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const total = votes.ups + votes.downs;
  const percent = total ? Math.round((votes.ups / total) * 100) : null;

  const buttons = (
    <ButtonGroup aria-label="Rate this recipe">
      <Button variant={votes.myVote === 1 ? 'success' : 'outline-success'} onClick={() => cast(1)} disabled={busy} aria-pressed={votes.myVote === 1} title="Good recipe">
        👍 {votes.ups}
      </Button>
      <Button variant={votes.myVote === -1 ? 'danger' : 'outline-danger'} onClick={() => cast(-1)} disabled={busy} aria-pressed={votes.myVote === -1} title="Not for me">
        👎 {votes.downs}
      </Button>
    </ButtonGroup>
  );

  return (
    <div className="d-flex align-items-center gap-2">
      {user ? (
        buttons
      ) : (
        <OverlayTrigger placement="top" overlay={<Tooltip id={`vote-tip-${recipeId}`}>Log in to vote</Tooltip>}>
          <span className="d-inline-block">{buttons}</span>
        </OverlayTrigger>
      )}
      {percent !== null && <small className="text-body-secondary">{percent}% liked this</small>}
    </div>
  );
}
