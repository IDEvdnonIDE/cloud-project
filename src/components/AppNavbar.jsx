import { useState } from 'react';
import { Button, Container, Form, Nav, NavDropdown, Navbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const close = () => setExpanded(false);

  const isLoginPage = useMatch('/login');
  const isRegisterPage = useMatch('/register');

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : '/recipes');
    setQuery('');
    close();
  };

  const onLogout = () => {
    logout();
    close();
    notify('You have been logged out', 'secondary');
    navigate('/');
  };

  return (
    <Navbar expand="lg" bg="white" sticky="top" className="border-bottom py-3" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={close} className="text-primary">
          Spoonful
        </Navbar.Brand>
        {/* on mobile the Sign up pill stays visible next to the menu button. */}
        {!user && (
          <Button as={Link} to="/register" size="sm" className="ms-auto me-2 d-lg-none" onClick={close}>
            Sign up
          </Button>
        )}
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/recipes" onClick={close}>
              Recipes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/chefs" onClick={close}>
              Chefs
            </Nav.Link>
          </Nav>

          {
            isLoginPage || isRegisterPage ? null :
              <Form className="d-flex my-2 my-lg-0 me-lg-3" role="search" onSubmit={onSearch}>
                <Form.Control
                  type="search"
                  size="sm"
                  className="rounded-pill px-3"
                  placeholder="Search recipes…"
                  aria-label="Search recipes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Form>
          }

          <Nav className="align-items-lg-center">
            {user ? (
              <NavDropdown
                align="end"
                id="user-menu"
                title={
                  <span>
                    {user.avatar} {user.name}
                  </span>
                }
              >
                <NavDropdown.Item as={Link} to="/profile" onClick={close}>
                  My profile
                </NavDropdown.Item>
                {user.role === 'creator' && (
                  <>
                    <NavDropdown.Item as={Link} to="/dashboard" onClick={close}>
                      Chef dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/dashboard/recipes/new" onClick={close}>
                      + New recipe
                    </NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>Log out</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login" onClick={close}>
                  Log in
                </Nav.Link>
                <Button as={Link} to="/register" className="ms-lg-2 d-none d-lg-inline-block" onClick={close}>
                  Sign up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
