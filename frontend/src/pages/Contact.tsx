import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import BookingForm from '../components/BookingForm';

const Contact: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="contact-page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/lashes" className={location.pathname === '/lashes' ? 'active' : ''}>Lashes</Link>
            <Link to="/makeup" className={location.pathname === '/makeup' ? 'active' : ''}>Makeup</Link>
            <Link to="/mehendi" className={location.pathname === '/mehendi' ? 'active' : ''}>Mehendi</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container contact-main">
          <div className="contact-inner">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-lead">
              Whatever you need — we’re here to help!
            </p>

            <div className="contact-block">
              <h3>General beauty bookings (lashes, makeup, threading)</h3>
              <p>
                If you want to order lashes or book lash lifts, brow lifts, professional makeup, or facial threading, contact us on:
              </p>
              <p>📱 WhatsApp: <a href="https://wa.me/46704679469" target="_blank" rel="noreferrer">+46 70 467 94 69</a> or DM us on Instagram <a href="https://www.instagram.com/ruaa5r/" target="_blank" rel="noreferrer">@ruaa5r</a></p>

              <h3 style={{ marginTop: 18 }}>Mehendi bookings</h3>
              <p>
                If you want to book Mehendi, contact us on:
              </p>
              <p>📱 WhatsApp: <a href="https://wa.me/467200030442" target="_blank" rel="noreferrer">+46 72 000 30 442</a> or DM us on Instagram <a href="https://www.instagram.com/glamourmehendi/" target="_blank" rel="noreferrer">@glamourmehendi</a></p>

              <p style={{ marginTop: 18 }}>
                If you want to book both beauty services + Mehendi, feel free to reach out on either number or message us on Instagram — we’ll take care of everything!
              </p>

              <p style={{ marginTop: 12 }}><strong>Your perfect look starts with a message.</strong></p>
            </div>

            {/* Booking form inserted here */}
            <BookingForm />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container text-center">
          <p>© {new Date().getFullYear()} Ruaa Beauty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
