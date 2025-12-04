import React from "react";
import './styles/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Mehendi from './pages/Mehendi';
import Contact from './pages/Contact';
import Makeup from './pages/Makeup';
import Book from './pages/Book';
import Lashes from './pages/Lashes';
import Reviews from './pages/Reviews';
import ResetPassword from './pages/ResetPassword';
import CancelBooking from './pages/CancelBooking';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import BottomNav from './components/BottomNav';
import PWAInstallHint from './components/PWAInstallHint';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  
  // Don't show bottom nav on admin page
  const showBottomNav = !location.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unbook" element={<CancelBooking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/mehendi" element={<Mehendi />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/makeup" element={<Makeup />} />
        <Route path="/book" element={<Book />} />
        <Route path="/lashes" element={<Lashes />} />
        <Route path="/reviews" element={<Reviews />} />
      </Routes>
      {showBottomNav && <BottomNav />}
      <PWAInstallHint position="corner" />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
