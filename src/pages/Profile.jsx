import { useState } from 'react';
import { Badge, Button, Card, Container, Form, ListGroup, Modal, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import RecipeGrid from '../components/RecipeGrid';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { EMOJIS } from '../utils/constants';
import { formatDate, timeAgo } from '../utils/format';

const AVATARS = ['🙂', '😋', '🧑‍🍳', '👩‍🍳', '👨‍🍳', '🥑', '🍕', '🍜', '🐼', '🦊'];

function EditProfileModal({ user, show, onHide, onSaved }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', avatar: user.avatar });
  const [busy, setBusy] = useState(false);
  const notify = useToast();

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateProfile(user.id, form);
      onSaved();
      notify('Profile updated');
      onHide();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={save}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Edit profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Form.Label>Avatar</Form.Label>
            <div className="d-flex flex-wrap gap-1">
              {[...new Set([...AVATARS, ...EMOJIS.slice(0, 6)])].map((a) => (
                <Button key={a} size="sm" variant={form.avatar === a ? 'primary' : 'outline-secondary'} className="fs-5 lh-1" onClick={() => setForm((f) => ({ ...f, avatar: a }))}>
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <Form.Group className="mb-3" controlId="profile-name">
            <Form.Label>Display name</Form.Label>
            <Form.Control required minLength={2} maxLength={40} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Form.Group>
          <Form.Group controlId="profile-bio">
            <Form.Label>Bio</Form.Label>
            <Form.Control as="textarea" rows={3} maxLength={200} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const favourites = useApi(() => api.getRecipesByIds(user.favourites), [user.favourites.join(',')]);
  const comments = useApi(() => api.getCommentsByUser(user.id), [user.id]);

  return (
    <Container>
      <Card className="shadow-sm mb-4">
        <Card.Body className="d-flex flex-column flex-sm-row align-items-sm-center gap-3 p-4">
          <div className="display-4 lh-1">{user.avatar}</div>
          <div className="flex-grow-1">
            <h1 className="h3 mb-1">
              {user.name}{' '}
              <Badge bg={user.role === 'creator' ? 'primary' : 'secondary'} className="fs-6 align-middle">
                {user.role === 'creator' ? 'Chef' : 'Food lover'}
              </Badge>
            </h1>
            <div className="text-body-secondary small">
              {user.email} · Joined {formatDate(user.joinedAt)}
            </div>
            {user.bio && <p className="mb-0 mt-2">{user.bio}</p>}
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
            {user.role === 'creator' && (
              <Button as={Link} to="/dashboard">
                Dashboard
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="saved" className="mb-4" id="profile-tabs">
        <Tab eventKey="saved" title={`Saved recipes (${user.favourites.length})`}>
          {!favourites.loading && (favourites.data || []).length === 0 ? (
            <EmptyState
              icon="♡"
              title="No saved recipes yet"
              text="Tap ♡ Save on any recipe to keep it here."
              action={
                <Button as={Link} to="/recipes">
                  Find recipes
                </Button>
              }
            />
          ) : (
            <RecipeGrid recipes={favourites.data || []} loading={favourites.loading} skeletons={3} />
          )}
        </Tab>
        <Tab eventKey="comments" title="My comments">
          {comments.loading ? (
            <Spinner animation="border" size="sm" />
          ) : (comments.data || []).length === 0 ? (
            <EmptyState icon="💬" title="No comments yet" text="Share tips and feedback on recipes you’ve tried." />
          ) : (
            <ListGroup className="shadow-sm">
              {comments.data.map((c) => (
                <ListGroup.Item key={c.id} action as={Link} to={`/recipes/${c.recipe.id}`} className="py-3">
                  <div className="d-flex justify-content-between">
                    <strong>
                      {c.recipe.emoji} {c.recipe.title}
                    </strong>
                    <small className="text-body-secondary">{timeAgo(c.createdAt)}</small>
                  </div>
                  <div className="text-body-secondary">{c.body}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Tab>
      </Tabs>

      {editing && <EditProfileModal user={user} show={editing} onHide={() => setEditing(false)} onSaved={refresh} />}
    </Container>
  );
}
