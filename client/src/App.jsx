import { Link, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useLang } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import UserRoute from './components/UserRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import FindParcels from './pages/FindParcels';
import RequestDetail from './pages/RequestDetail';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRequests from './pages/admin/AdminRequests';
import AdminPayments from './pages/admin/AdminPayments';

function NotFound() {
  const { t } = useLang();
  return (
    <section className="cc-container cc-notfound">
      <div className="big" aria-hidden="true">404</div>
      <h1 className="cc-h1" style={{ marginTop: 8 }}>{t('nf.title')}</h1>
      <p className="cc-sub" style={{ margin: '8px auto 22px', maxWidth: 420 }}>{t('nf.text')}</p>
      <Link to="/" className="cc-btn cc-btn-primary">{t('nf.back')} <span className="arrow">→</span></Link>
    </section>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <div className={`cc-app${user ? ' has-bottom' : ''}`}>
      <Navbar />

      <main className="cc-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* সাধারণ user এর page: admin ঢুকলে নিজের panel এ ফেরত যায় */}
          <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
          <Route path="/requests/new" element={<UserRoute><NewRequest /></UserRoute>} />
          <Route path="/find-parcels" element={<UserRoute><FindParcels /></UserRoute>} />
          <Route path="/wallet" element={<UserRoute><Wallet /></UserRoute>} />

          {/* admin ও request দেখতে পারে (শুধু পড়ার জন্য), আর Profile সবার */}
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
