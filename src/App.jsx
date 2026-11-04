import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ChefProfile from './pages/ChefProfile';
import Chefs from './pages/Chefs';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEditor from './pages/RecipeEditor';
import Recipes from './pages/Recipes';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <div className="d-flex flex-column min-vh-100">
            <AppNavbar />
            <main className="flex-grow-1 pt-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/chefs" element={<Chefs />} />
                <Route path="/chefs/:id" element={<ChefProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute roles={['creator']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/recipes/new"
                  element={
                    <ProtectedRoute roles={['creator']}>
                      <RecipeEditor key="new" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/recipes/:id/edit"
                  element={
                    <ProtectedRoute roles={['creator']}>
                      <RecipeEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
