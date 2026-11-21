import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminProtectedRoute from './components/AdminProtectedRoute';

import Home from './pages/Home';
import RoleSelect from './pages/RoleSelect';
import ResumeDraft from './pages/ResumeDraft';
import SectionA from './pages/SectionA';
import SectionB from './pages/SectionB';
import SectionC from './pages/SectionC';
import SectionD from './pages/SectionD';
import Review from './pages/Review';
import Success from './pages/Success';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminSubmissionDetail from './pages/admin/AdminSubmissionDetail';
import AdminExpiryDashboard from './pages/admin/AdminExpiryDashboard';

export default function App() {
  return (
    <>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RoleSelect />} />
          <Route path="/resume" element={<ResumeDraft />} />
          <Route path="/register/basic-details" element={<SectionA />} />
          <Route path="/register/role-details" element={<SectionB />} />
          <Route path="/register/documents" element={<SectionC />} />
          <Route path="/register/declaration" element={<SectionD />} />
          <Route path="/register/review" element={<Review />} />
          <Route path="/success" element={<Success />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminSubmissions />} />
            <Route path="submissions/:id" element={<AdminSubmissionDetail />} />
            <Route path="expiry" element={<AdminExpiryDashboard />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  );
}
