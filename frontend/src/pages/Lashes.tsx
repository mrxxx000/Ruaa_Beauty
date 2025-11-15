import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';

const Lashes: React.FC = () => {
  return (
    <div className="page-coming-soon">
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
            <Link to="/makeup">Makeup</Link>
            <Link to="/mehendi">Mehendi</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>Lashes — Coming soon</h1>
          <p style={{ color: '#666' }}>We're working on this page. Check back soon for lash services and galleries.</p>
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

export default Lashes;
