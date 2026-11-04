import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  { label: 'Chef', email: 'chef@demo.com' },
  { label: 'Food lover', email: 'user@demo.com' },
];

export default function Login() {
  const { user, login } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once signed in, go back to wherever the user came from.
  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setValidated(true);
    if (!e.currentTarget.checkValidity()) return;
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      notify(`Welcome back, ${u.name}!`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col sm={10} md={7} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h1 className="h3 mb-1">Welcome back</h1>
              <p className="text-body-secondary mb-4">Log in to vote, comment and save recipes.</p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form noValidate validated={validated} onSubmit={submit}>
                <Form.Group className="mb-3" controlId="login-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
                  <Form.Control.Feedback type="invalid">Please enter a valid email.</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-4" controlId="login-password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" required autoComplete="current-password" value={form.password} onChange={set('password')} />
                  <Form.Control.Feedback type="invalid">Please enter your password.</Form.Control.Feedback>
                </Form.Group>
                <Button type="submit" className="w-100" size="lg" disabled={busy}>
                  {busy ? 'Logging in…' : 'Log in'}
                </Button>
              </Form>

              <p className="text-center mt-4 mb-0">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </Card.Body>
            <Card.Footer className="bg-body-tertiary p-3">
              <div className="small text-body-secondary mb-2">Try a demo account (password: “password”)</div>
              <div className="d-flex gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <Button key={a.email} size="sm" variant="outline-secondary" onClick={() => setForm({ email: a.email, password: 'password' })}>
                    {a.label}: {a.email}
                  </Button>
                ))}
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
