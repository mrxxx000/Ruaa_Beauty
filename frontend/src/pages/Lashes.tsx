import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';

const Lashes: React.FC = () => {
  const location = useLocation();
  
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
