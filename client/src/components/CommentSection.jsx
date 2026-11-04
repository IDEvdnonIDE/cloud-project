import { useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Stack } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { timeAgo } from '../utils/format';
import ConfirmModal from './ConfirmModal';

const MAX_LENGTH = 1000;
const PAGE = 5;

export default function CommentSection({ recipe }) {
  const { user } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const { data, loading, reload } = useApi(() => api.getComments(recipe.id), [recipe.id]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const comments = data || [];
  const canDelete = (c) => user && (c.userId === user.id || recipe.authorId === user.id);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await api.addComment(recipe.id, user, body);
      setBody('');
      reload();
      notify('Comment posted');
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteComment(toDelete.id, user);
      notify('Comment deleted', 'secondary');
      setToDelete(null);
      reload();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="py-3">
        <h2 className="h5 mb-0">
          Comments{' '}
          <Badge bg="secondary" pill>
            {comments.length}
          </Badge>
        </h2>
      </Card.Header>
      <Card.Body>
        {user ? (
          <Form onSubmit={submit} className="mb-4">
            <Form.Group controlId="comment-body">
              <Form.Label visuallyHidden>Your comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={MAX_LENGTH}
                placeholder="Share your thoughts, tips or substitutions…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-body-secondary">
                {body.length}/{MAX_LENGTH}
              </small>
              <Button type="submit" disabled={saving || !body.trim()}>
                {saving ? 'Posting…' : 'Post comment'}
              </Button>
            </div>
          </Form>
        ) : (
          <Alert variant="light" className="border">
            Please{' '}
            <Alert.Link as={Link} to="/login" state={{ from: location.pathname }}>
              log in
            </Alert.Link>{' '}
            to leave a comment.
          </Alert>
        )}

        {loading && !data ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" role="status" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-body-secondary mb-0">No comments yet — be the first!</p>
        ) : (
          <Stack gap={4}>
            {comments.slice(0, visible).map((c) => (
              <div key={c.id} className="d-flex gap-3">
                <div className="fs-3 lh-1" aria-hidden="true">
                  {c.author.avatar}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <strong>{c.author.name}</strong>
                      {c.author.id === recipe.authorId && (
                        <Badge bg="primary" className="ms-2">
                          Chef
                        </Badge>
                      )}
                      <small className="text-body-secondary ms-2">{timeAgo(c.createdAt)}</small>
                    </div>
                    {canDelete(c) && (
                      <Button variant="link" size="sm" className="text-danger p-0" onClick={() => setToDelete(c)}>
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="mb-0 text-break">{c.body}</p>
                </div>
              </div>
            ))}
            {visible < comments.length && (
              <Button variant="outline-secondary" size="sm" className="align-self-center" onClick={() => setVisible((v) => v + PAGE)}>
                Show more comments
              </Button>
            )}
          </Stack>
        )}
      </Card.Body>

      <ConfirmModal show={Boolean(toDelete)} title="Delete comment?" busy={deleting} onConfirm={confirmDelete} onHide={() => setToDelete(null)}>
        This comment will be removed permanently.
      </ConfirmModal>
    </Card>
  );
}
