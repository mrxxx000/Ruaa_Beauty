import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';

const Contact: React.FC = () => {
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
            <Link to="/">Home</Link>
            <Link to="#Lashes">Lashes</Link>
            <Link to="#Makeup">Makeup</Link>
            <Link to="/mehendi">Mehendi</Link>
            <Link to="#about">About</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container" style={{ padding: '48px 0' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.4rem', marginBottom: 12 }}>Contact Us</h1>
            <p style={{ fontSize: '1.05rem', color: '#333' }}>
              Whatever you need — we’re here to help!
            </p>

            <div style={{ marginTop: 20, fontSize: '1.05rem', textAlign: 'left' }}>
              <h3>General beauty bookings (lashes, makeup, threading)</h3>
              <p>
                If you want to order lashes or book lash lifts, brow lifts, professional makeup, or facial threading, contact us on:
              </p>
              <p>📱 WhatsApp: <a href="https://wa.me/46706479469" target="_blank" rel="noreferrer">+46 70 647 94 69</a> or DM us on Instagram <a href="https://www.instagram.com/ruaa5r/" target="_blank" rel="noreferrer">@ruaa5r</a></p>

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
