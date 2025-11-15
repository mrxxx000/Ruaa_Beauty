import React from 'react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import Hero from '../components/Hero';
import MehendiSection from '../components/MehendiSection';

const Home: React.FC = () => {
  return (
    <div className="home-landing">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">

            {/* Using the image imported from src so the bundler serves it correctly; sizing controlled via CSS */}
            <img src={logoImg} alt="Ruaa Beauty logo" />
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
            <a href="#Lashes">Lashes</a>
            <a href="#Makeup">Makeup</a>
            <a href="#Mehendi">Mehendi</a>
            <a href="#products">Products</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main>
  <Hero />
  <MehendiSection />

        <section className="features container" id="about">
          <div className="feature">
            <div className="feature-icon">✨</div>
            <h3>Premium Quality</h3>
            <p>Only the finest beauty products, carefully selected for exceptional quality and performance.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">💗</div>
            <h3>Cruelty-Free</h3>
            <p>All our products are ethically sourced and never tested on animals.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">🛡️</div>
            <h3>Satisfaction Guaranteed</h3>
            <p>Love it or return it. We stand behind every product we sell.</p>
          </div>
        </section>

        <section className="cta">
          <div className="container text-center">
            <h2>Ready to Glow?</h2>
            <p>Browse our collection of premium beauty products and find your perfect match.</p>
            <a className="primary-btn" href="#products">Explore Products</a>
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

export default Home;
