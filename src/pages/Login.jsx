import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  { label: 'Chef', email: 'chef@demo.com' },
  { label: 'Food lover', email: 'user@demo.com' },
];

// Map Firebase error codes to user-friendly messages.
function friendlyError(code) {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// Google icon SVG component
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 0 0 0 24c0 3.77.9 7.35 2.56 10.52l7.97-5.93z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.93C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Login page component
export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      const { profile, isNew } = await loginWithGoogle();
      if (isNew) {
        navigate('/register');
      } else {
        notify(`Welcome back, ${profile.name}!`);
      }
    } catch (err) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  // Render the login form
  return (
    <Container>
      <Row className="justify-content-center">
        <Col sm={10} md={7} lg={5}>
          <Card>
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

              <div className="text-center text-body-secondary my-3">or</div>

              <Button variant="outline-dark" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleGoogle} disabled={busy}>
                <GoogleIcon />
                Continue with Google
              </Button>

              <p className="text-center mt-4 mb-0">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </Card.Body>
            <Card.Footer className="bg-body-tertiary p-3">
              <div className="small text-body-secondary mb-2">Try a demo account (password: &quot;password&quot;)</div>
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