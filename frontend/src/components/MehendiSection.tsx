import React, { useEffect, useState } from 'react';
import '../styles/App.css';

const mehendiHero = process.env.PUBLIC_URL + '/assets/SnapInsta.to_432691013_331302829451121_5481086954294582843_n.jpg';
const pairA_left = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448241189_1815301755622097_667881131947720916_n.jpg';
const pairA_right = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448396960_432194449635910_11943437998895029_n.jpg';
const singleImg = process.env.PUBLIC_URL + '/assets/503560008_18060668414464336_4481666084541690454_n.jpeg';

const slides = [
  { type: 'pair', left: pairA_left, right: pairA_right },
  { type: 'pair', left: pairA_right, right: pairA_left }, // swapped
  { type: 'single', src: singleImg },
];

const MehendiSection: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];

  return (
    <section id="Mehendi" className="mehendi-section">
      <div
        className="mehendi-hero"
        style={{
          backgroundImage: `url(${mehendiHero})`,
        }}
      >
        <div className="mehendi-hero-overlay" />
        <div className="container mehendi-hero-inner">
          <div className="mehendi-text">
            <h2 className="mehendi-title">Exquisite Mehendi Designs for Every Occasion</h2>
            <p className="mehendi-desc">
              Celebrate your special moments with our intricate Mehendi artistry. From weddings and
              engagements to festive gatherings, we create stunning hand and arm designs that are as
              unique as you. Beautiful, detailed, and crafted with love
            </p>
          </div>
        </div>
      </div>

      <div className="container mehendi-gallery">
        <div className="mehendi-slide" aria-live="polite">
          {slide.type === 'pair' ? (
            <div className="pair-wrap">
              <img src={slide.left} alt="Mehendi design left" className="pair-img" />
              <img src={slide.right} alt="Mehendi design right" className="pair-img" />
            </div>
          ) : (
            <div className="single-wrap">
              <img src={slide.src} alt="Mehendi design" className="single-img" />
            </div>
          )}
        </div>

        <div className="mehendi-thumbs">
          <button
            className={`thumb-btn ${index === 0 ? 'active' : ''}`}
            onClick={() => setIndex(0)}
            aria-label="Show pair 1"
          />
          <button
            className={`thumb-btn ${index === 1 ? 'active' : ''}`}
            onClick={() => setIndex(1)}
            aria-label="Show pair 2"
          />
          <button
            className={`thumb-btn ${index === 2 ? 'active' : ''}`}
            onClick={() => setIndex(2)}
            aria-label="Show single"
          />
        </div>
      </div>
    </section>
  );
};

export default MehendiSection;
