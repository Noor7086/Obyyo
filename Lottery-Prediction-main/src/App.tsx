import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { PredictionProvider } from './contexts/PredictionContext'
import { WalletProvider } from './contexts/WalletContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Predictions from './pages/Predictions'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOTP from './pages/auth/VerifyOTP'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/user/Dashboard'
import Profile from './pages/user/Profile'
import MyPredictions from './pages/user/MyPredictions'
import Wallet from './pages/user/Wallet'
import UserResults from './pages/user/Results'
import NumberGenerator from './pages/tools/NumberGenerator'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPredictions from './pages/admin/AdminPredictions'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import Results from './pages/Results'
import HowItWorks from './pages/HowItWorks'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsConditions from './pages/legal/TermsConditions'
import ResponsiblePlay from './pages/legal/ResponsiblePlay'
import AvoidScams from './pages/legal/AvoidScams'
import Disclaimer from './pages/legal/Disclaimer'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import AdminRedirect from './components/auth/AdminRedirect'
import PublicRoute from './components/auth/PublicRoute'
import TawkTo from './components/TawkTo'

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Component to conditionally render navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null; // Admin pages render their own navbar
  }

  return <Navbar />;
};

// Component to conditionally render footer
const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null; // Admin pages don't need footer
  }

  return <Footer />;
};

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <PredictionProvider>
          <div className="App" style={{ margin: 0, padding: 0 }}>
            <ScrollToTop />
            {/* <TawkTo /> */}
            <ConditionalNavbar />
            <main style={{ margin: 0, padding: 0 }}>
              <Routes>
                {/* Public Routes - Redirect admins to /admin */}
                <Route path="/" element={
                  <PublicRoute>
                    <Home />
                  </PublicRoute>
                } />
                <Route path="/about" element={
                  <PublicRoute>
                    <About />
                  </PublicRoute>
                } />
                <Route path="/predictions" element={
                  <PublicRoute>
                    <Predictions />
                  </PublicRoute>
                } />
                <Route path="/blog" element={
                  <PublicRoute>
                    <Blog />
                  </PublicRoute>
                } />
                <Route path="/contact" element={
                  <PublicRoute>
                    <Contact />
                  </PublicRoute>
                } />
                <Route path="/faq" element={
                  <PublicRoute>
                    <FAQ />
                  </PublicRoute>
                } />
                <Route path="/how-it-works" element={
                  <PublicRoute>
                    <HowItWorks />
                  </PublicRoute>
                } />
                <Route path="/features" element={
                  <PublicRoute>
                    <Features />
                  </PublicRoute>
                } />
                <Route path="/pricing" element={
                  <PublicRoute>
                    <Pricing />
                  </PublicRoute>
                } />
                <Route path="/results" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <Results />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />
                <Route path="/tools/number-generator" element={
                  <PublicRoute>
                    <NumberGenerator />
                  </PublicRoute>
                } />

                {/* Legal Pages - Redirect admins to /admin */}
                <Route path="/privacy-policy" element={
                  <PublicRoute>
                    <PrivacyPolicy />
                  </PublicRoute>
                } />
                <Route path="/terms-conditions" element={
                  <PublicRoute>
                    <TermsConditions />
                  </PublicRoute>
                } />
                <Route path="/responsible-play" element={
                  <PublicRoute>
                    <ResponsiblePlay />
                  </PublicRoute>
                } />
                <Route path="/avoid-scams" element={
                  <PublicRoute>
                    <AvoidScams />
                  </PublicRoute>
                } />
                <Route path="/disclaimer" element={
                  <PublicRoute>
                    <Disclaimer />
                  </PublicRoute>
                } />

                {/* Auth Routes - Allow admins to access for logout/login */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected User Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <Dashboard />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <Profile />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />
                <Route path="/my-predictions" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <MyPredictions />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />
                <Route path="/wallet" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <Wallet />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />
                <Route path="/my-results" element={
                  <ProtectedRoute>
                    <AdminRedirect>
                      <UserResults />
                    </AdminRedirect>
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/predictions" element={
                  <AdminRoute>
                    <AdminPredictions />
                  </AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />
                <Route path="/admin/payments" element={
                  <AdminRoute>
                    <AdminPayments />
                  </AdminRoute>
                } />

                {/* 404 - Catch all unmatched routes */}
                <Route path="*" element={
                  <div className="d-flex justify-content-center align-items-center min-vh-100">
                    <div className="text-center">
                      <h1 className="display-1 fw-bold text-primary">404</h1>
                      <h2 className="mb-4">Page Not Found</h2>
                      <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
                      <Link to="/" className="btn btn-primary btn-lg">
                        Go Home
                      </Link>
                    </div>
                  </div>
                } />
              </Routes>
            </main>
            <ConditionalFooter />
          </div>
        </PredictionProvider>
      </WalletProvider>
    </AuthProvider>
  )
}

export default App

