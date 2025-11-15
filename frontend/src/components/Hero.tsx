import React from 'react';
import '../styles/App.css';

// Serve the image from the public folder so CRA can include it in builds.
// Use a simple filename (no spaces) to avoid URL encoding issues in some browsers.
const heroImage = process.env.PUBLIC_URL + '/assets/hero-lashes.png';

const Hero: React.FC = () => {
  return (
    <section
      className="hero"
      style={{
        position: 'relative',
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* dark gradient overlay */}
      <div
        className="hero-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.25))',
        }}
      />

      <div className="container hero-inner" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-text">
          <h1 className="hero-title" style={{ color: '#f108b7ff' }}>
            Ruaa Beauty
          </h1>
          <p className="hero-sub" style={{ color: 'rgba(209, 27, 27, 0.95)', marginTop: 6 }}>
            Where Elegance Meets Artistry
          </p>
          <p style={{ color: 'rgba(255,255,255,0.95)', marginTop: 12, maxWidth: 680 }}>
            From luxurious lash extensions and lash lifts to brow lifts, professional makeup, facial threading, and intricate 
            Mehendi (Henna) designs, we bring your beauty dreams to life. Perfect for weddings, parties, or any special occasion 
            in our studio or right at your home. All the beauty you need, all in one place.

          </p>

          <div style={{ marginTop: 18 }}>
            <a className="primary-btn" href="#book">
              Book Appointment
            </a>

            <a className="secondary-btn" href="#gallery" style={{ marginLeft: 12 }}>
              View Gallery
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
