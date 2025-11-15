import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import { Link } from 'react-router-dom';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';

const slideA = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448241189_1815301755622097_667881131947720916_n.jpg';
const slideB = process.env.PUBLIC_URL + '/assets/SnapInsta.to_448396960_432194449635910_11943437998895029_n.jpg';
const heroImg = process.env.PUBLIC_URL + '/assets/SnapInsta.to_432691013_331302829451121_5481086954294582843_n.jpg';
const singleImg = process.env.PUBLIC_URL + '/assets/503560008_18060668414464336_4481666084541690454_n.jpeg';
const more1 = process.env.PUBLIC_URL + '/assets/f9ee56db-cfbd-4a39-99db-cfc4a268312f.jpg';
const more2 = process.env.PUBLIC_URL + '/assets/13c307f1-e5bc-4f0c-ab4b-6a7cb281e89c.jpg';

const Mehendi: React.FC = () => {
	const [active, setActive] = useState<'a' | 'b'>('a');

	useEffect(() => {
		const t = setInterval(() => setActive((p) => (p === 'a' ? 'b' : 'a')), 3500);
		return () => clearInterval(t);
	}, []);

	return (
		<div className="mehendi-page">
			<header className="site-header">
				<div className="container header-inner">
					<div className="brand">
									<Link to="/">
										<img src={logoImg} alt="Ruaa Beauty logo" style={{ height: 70 }} />
									</Link>
						<span className="brand-title">Ruaa Beauty</span>
					</div>
					<nav className="nav">
						<Link to="/">Home</Link>
                        <Link to="#Lashes">Lashes</Link>
                        <Link to="#Makeup">Makeup</Link>
                        <Link to="#about">About</Link>
                        <Link to="/contact">Contact</Link>
					</nav>
				</div>
			</header>

			<main>
				<section
					className="mehendi-hero"
					style={{ backgroundImage: `url(${heroImg})` }}
				>
					<div className="mehendi-hero-overlay" />
					<div className="container mehendi-hero-inner">
						<div className="mehendi-text">
							<h2 className="mehendi-title">Exquisite Mehendi Designs for Every Occasion</h2>
							<p className="mehendi-desc">
								Celebrate your special moments with our intricate Mehendi artistry. From weddings and engagements to
								festive gatherings, we create stunning hand and arm designs that are as unique as you. Beautiful,
								detailed, and crafted with love.
							</p>
						</div>
					</div>
				</section>

				<section className="container mehendi-gallery">
					<div className="mehendi-slide" aria-live="polite">
						<div className="pair" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
							<img src={active === 'a' ? slideA : slideB} alt="Mehendi design left" className="pair-img" />
							<img src={active === 'a' ? slideB : slideA} alt="Mehendi design right" className="pair-img" />
						</div>
					</div>

					<div style={{ marginTop: 12, textAlign: 'center' }} className="mehendi-thumbs">
						<button className="secondary-btn" onClick={() => setActive('a')}>Show Set A</button>
						<button className="secondary-btn" onClick={() => setActive('b')}>Show Set B</button>
					</div>

					<div style={{ marginTop: 28 }}>
						<h3>More designs</h3>
						<div className="more-designs-grid" style={{ marginTop: 12 }}>
							<div className="single-wrap">
								<img src={singleImg} alt="Mehendi single" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more1} alt="Mehendi extra 1" className="single-img" />
							</div>
							<div className="single-wrap">
								<img src={more2} alt="Mehendi extra 2" className="single-img" />
							</div>
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

export default Mehendi;

