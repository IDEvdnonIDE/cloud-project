import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLES = [
  { value: 'user', title: 'Food lover', text: 'Search, save, vote and comment on recipes.' },
  { value: 'creator', title: 'Chef / creator', text: 'Everything above, plus publish your own recipes.' },
];

export default function Register() {
  const { user, register } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', date_of_birth:'', confirm: '', role: 'user' });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'creator' ? '/dashboard' : '/'} replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const mismatch = form.confirm !== form.password;

  const submit = async (e) => {
    e.preventDefault();
    setValidated(true);
    if (!e.currentTarget.checkValidity() || mismatch) return;
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      notify(`Welcome to Spoonful, ${u.name}!`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={9} lg={6}>
          <Card>
            <Card.Body className="p-4 p-md-5">
              <h1 className="h3 mb-1">Create your account</h1>
              <p className="text-body-secondary mb-4">Join the community in under a minute.</p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form noValidate validated={validated} onSubmit={submit}>
                <div className="mb-4">
                  <Form.Label>I want to join as</Form.Label>
                  <Row xs={1} sm={2} className="g-2">
                    {ROLES.map((r) => (
                      <Col key={r.value}>
                        <Card
                          as="label"
                          htmlFor={`role-${r.value}`}
                          border={form.role === r.value ? 'primary' : undefined}
                          className={`h-100 border ${form.role === r.value ? 'border-2 bg-primary-subtle' : ''}`}
                        >
                          <Card.Body className="d-flex gap-2">
                            <Form.Check type="radio" id={`role-${r.value}`} name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} />
                            <div>
                              <div className="fw-semibold">{r.title}</div>
                              <div className="small text-body-secondary">{r.text}</div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <Form.Group className="mb-3" controlId="reg-name">
                  <Form.Label>Display name</Form.Label>
                  <Form.Control required minLength={2} maxLength={40} autoComplete="name" value={form.name} onChange={set('name')} />
                  <Form.Control.Feedback type="invalid">Please enter at least 2 characters.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="reg-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
                  <Form.Control.Feedback type="invalid">Please enter a valid email.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="reg-email">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control type="date" required value={form.date_of_birth} onChange={set('date_of_birth')} />
                  <Form.Control.Feedback type="invalid">Please enter a valid date.</Form.Control.Feedback>
                </Form.Group>
                <Row className="g-3 mb-4">
                  <Form.Group as={Col} sm={6} controlId="reg-password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
                    <Form.Control.Feedback type="invalid">At least 6 characters.</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} sm={6} controlId="reg-confirm">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control
                      type="password"
                      required
                      autoComplete="new-password"
                      value={form.confirm}
                      onChange={(e) => {
                        e.target.setCustomValidity(e.target.value !== form.password ? 'Passwords do not match' : '');
                        set('confirm')(e);
                      }}
                    />
                    <Form.Control.Feedback type="invalid">Passwords don’t match.</Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Button type="submit" size="lg" className="w-100" disabled={busy}>
                  {busy ? 'Creating account…' : 'Create account'}
                </Button>
              </Form>

              <p className="text-center mt-4 mb-0">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
