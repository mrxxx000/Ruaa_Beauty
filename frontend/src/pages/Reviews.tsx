import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import ReviewCard from '../components/ReviewCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';
import { getAllReviews, deleteReview, submitReview } from '../reviewApi';
import '../styles/reviews.css';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  users: {
    id: number;
    name: string;
    email: string;
  };
  replies?: Array<{
    id: number;
    user_id: number;
    reply: string;
    created_at: string;
    users: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

const Reviews: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  
  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userObj = JSON.parse(user);
        setIsAuthenticated(true);
        setCurrentUserId(userObj.id);
      } catch (err) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllReviews(100, 0);
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!comment.trim()) {
      setSubmitError('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const newReview = await submitReview(rating, comment);
      setComment('');
      setRating(5);
      setSubmitSuccess(true);
      fetchReviews();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  return (
    <div className="reviews-page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t('nav.home')}</Link>

            <div className="nav-dropdown">
              <button
                className="nav-dropdown-btn"
                onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
              >
                Salon Services
                <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: salonDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {salonDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/makeup" className={location.pathname === '/makeup' ? 'active' : ''} onClick={() => setSalonDropdownOpen(false)}>
                    {t('nav.makeup')}
                  </Link>
                  <Link to="/mehendi" className={location.pathname === '/mehendi' ? 'active' : ''} onClick={() => setSalonDropdownOpen(false)}>
                    {t('nav.mehendi')}
                  </Link>
                </div>
              )}
            </div>

            <div className="nav-dropdown">
              <button
                className="nav-dropdown-btn"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                Products
                <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: productsDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {productsDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/lashes" className={location.pathname === '/lashes' ? 'active' : ''} onClick={() => setProductsDropdownOpen(false)}>
                    {t('nav.lashes')}
                  </Link>
                </div>
              )}
            </div>

            <Link to="/book" className={location.pathname === '/book' ? 'active' : ''}>{t('nav.book')}</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>{t('nav.contact')}</Link>
            <Link to="/reviews" className={location.pathname === '/reviews' ? 'active' : ''}>{t('nav.reviews')}</Link>
          </nav>
          <AuthModal />
        </div>
      </header>

      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <main>
        <div className="reviews-header">
          <h1>{t('reviews.title', 'Our Reviews')}</h1>
          <p>{t('reviews.subtitle', 'See what our clients have to say')}</p>
        </div>

        {/* Review Submission Form - Only for logged in users */}
        {isAuthenticated && (
          <div className="review-submission-section">
            <h2>Leave a Review</h2>
            <form onSubmit={handleSubmitReview} className="review-form">
              {submitError && <div className="form-error">{submitError}</div>}
              {submitSuccess && <div className="form-success">✨ Thank you! Your review has been submitted successfully.</div>}
              
              <div className="form-group">
                <label htmlFor="rating">Rating</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                      title={`${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Your Review</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with us..."
                  rows={5}
                  maxLength={500}
                  disabled={submitting}
                />
                <div className="char-count">{comment.length}/500</div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting || !comment.trim()}
              >
                {submitting ? '⏳ Submitting...' : '✨ Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* Login Prompt - Only for non-logged in users */}
        {!isAuthenticated && (
          <div className="login-prompt">
            <p>👤 Sign in to share your experience and leave a review</p>
          </div>
        )}

        {loading && <p className="loading">Loading reviews...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && reviews.length === 0 && !error && (
          <p className="no-reviews">No reviews yet. Be the first to leave a review!</p>
        )}

        <div className="reviews-container">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              rating={review.rating}
              comment={review.comment}
              created_at={review.created_at}
              users={review.users}
              replies={review.replies}
              currentUserId={currentUserId}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default Reviews;
