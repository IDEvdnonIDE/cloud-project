import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLES = [
  { value: 'user', title: 'Food lover', text: 'Search, save, vote and comment on recipes.' },
  { value: 'creator', title: 'Chef / creator', text: 'Everything above, plus publish your own recipes.' },
];

// Map Firebase error codes to user-friendly messages.
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// Inline Google "G" logo.
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

export default function Register() {
  const { user, register, loginWithGoogle, completeGoogleSignUp } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', date_of_birth: '', confirm: '', role: 'user' });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Google user needs to fill extra fields before proceeding.
  const [googleStep, setGoogleStep] = useState(null); // null = normal flow, object = Google user info
  const [extraForm, setExtraForm] = useState({ name: '', role: 'user', date_of_birth: '' });
  const [extraValidated, setExtraValidated] = useState(false);

  // Redirect once fully registered (has a profile with role set).
  if (user && !googleStep) return <Navigate to={user.role === 'creator' ? '/dashboard' : '/'} replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setExtra = (field) => (e) => setExtraForm((f) => ({ ...f, [field]: e.target.value }));
  const mismatch = form.confirm !== form.password;

  // Email + password registration.
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
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  // Google sign-up
  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      const { profile, isNew } = await loginWithGoogle();
      if (isNew) {
        // form to collect role, name and date of birth.
        setGoogleStep(profile);
        setExtraForm({ name: profile.name || '', role: 'user', date_of_birth: '' });
        setBusy(false);
      } else {
        notify(`Welcome back, ${profile.name}!`);
      }
    } catch (err) {
      setError(friendlyError(err.code));
      setBusy(false);
    }
  };

  // save extra fields to Firestore (for google sign-up)
  const submitExtra = async (e) => {
    e.preventDefault();
    setExtraValidated(true);
    if (!e.currentTarget.checkValidity()) return;
    setBusy(true);
    setError('');
    try {
      const u = await completeGoogleSignUp({
        name: extraForm.name,
        role: extraForm.role,
        dateOfBirth: extraForm.date_of_birth,
      });
      setGoogleStep(null); // Clear step so the redirect triggers.
      notify(`Welcome to Spoonful, ${u.name}!`);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  // Google extra-fields form
  if (googleStep) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={9} lg={6}>
            <Card>
              <Card.Body className="p-4 p-md-5">
                <h1 className="h3 mb-1">Almost there!</h1>
                <p className="text-body-secondary mb-4">
                  Signed in as <strong>{googleStep.email}</strong>. Just a few more details.
                </p>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form noValidate validated={extraValidated} onSubmit={submitExtra}>
                  <div className="mb-4">
                    <Form.Label>I want to join as</Form.Label>
                    <Row xs={1} sm={2} className="g-2">
                      {ROLES.map((r) => (
                        <Col key={r.value}>
                          <Card
                            as="label"
                            htmlFor={`role-g-${r.value}`}
                            border={extraForm.role === r.value ? 'primary' : undefined}
                            className={`h-100 border ${extraForm.role === r.value ? 'border-2 bg-primary-subtle' : ''}`}
                          >
                            <Card.Body className="d-flex gap-2">
                              <Form.Check type="radio" id={`role-g-${r.value}`} name="role" value={r.value} checked={extraForm.role === r.value} onChange={setExtra('role')} />
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

                  <Form.Group className="mb-3" controlId="extra-name">
                    <Form.Label>Display name</Form.Label>
                    <Form.Control required minLength={2} maxLength={40} value={extraForm.name} onChange={setExtra('name')} />
                    <Form.Control.Feedback type="invalid">Please enter at least 2 characters.</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="extra-dob">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control type="date" required value={extraForm.date_of_birth} onChange={setExtra('date_of_birth')} />
                    <Form.Control.Feedback type="invalid">Please enter a valid date.</Form.Control.Feedback>
                  </Form.Group>

                  <Button type="submit" size="lg" className="w-100" disabled={busy}>
                    {busy ? 'Finishing up…' : 'Complete registration'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Normal registration form
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
                <Form.Group className="mb-3" controlId="reg-dob">
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
                    <Form.Control.Feedback type="invalid">Passwords don't match.</Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Button type="submit" size="lg" className="w-100" disabled={busy}>
                  {busy ? 'Creating account…' : 'Create account'}
                </Button>
              </Form>

              <div className="text-center text-body-secondary my-3">or</div>

              {/* Google sign-up button — below the form */}
              <Button variant="outline-dark" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleGoogle} disabled={busy}>
                <GoogleIcon />
                Sign up with Google
              </Button>

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