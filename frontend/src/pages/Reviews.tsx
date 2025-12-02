import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Star, MessageCircle, Trash2 } from 'lucide-react';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';
import { getAllReviews, deleteReview, addReplyToReview, getReviewWithReplies, deleteReply } from '../reviewApi';
import { useReviewUpdates } from '../hooks/useReviewUpdates';
import '../styles/reviews.css';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  service?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  users?: {
    id: number;
    name: string;
    email: string;
  };
  replies?: Array<{
    id: number;
    user_id: number;
    reply_text?: string;
    reply?: string;
    created_at: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
    users?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  review_replies?: Array<{
    id: number;
    user_id: number;
    reply_text?: string;
    reply?: string;
    created_at: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
    users?: {
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
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Initialize review updates hook
  useReviewUpdates();

  useEffect(() => {
    fetchReviews();
    checkAuthentication();

    // Listen for real-time review updates from other parts of the app (e.g., admin dashboard)
    const handleReviewUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        const { type, reviewId, replyId } = e.detail;
        
        if (type === 'review_deleted') {
          setReviews(prev => prev.filter(r => r.id !== reviewId));
        } else if (type === 'reply_deleted') {
          setReviews(prev =>
            prev.map(review => ({
              ...review,
              replies: review.replies?.filter(r => r.id !== replyId),
              review_replies: review.review_replies?.filter(r => r.id !== replyId)
            }))
          );
        }
      }
    };

    const handleUserLogin = (e: Event) => {
      if (e instanceof CustomEvent) {
        const { user } = e.detail;
        setIsAuthenticated(true);
        setCurrentUserId(user.id);
      }
    };

    const handleUserLogout = (e: Event) => {
      setIsAuthenticated(false);
      setCurrentUserId(undefined);
    };

    window.addEventListener('reviewUpdated', handleReviewUpdate);
    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('userLogout', handleUserLogout);
    
    return () => {
      window.removeEventListener('reviewUpdated', handleReviewUpdate);
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('userLogout', handleUserLogout);
    };
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
      
      const reviewsWithReplies = (data.reviews || []).map((review: Review) => ({
        ...review,
        replies: review.review_replies || review.replies || []
      }));
      
      setReviews(reviewsWithReplies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
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

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      await addReplyToReview(reviewId, replyText);
      const updatedReview = await getReviewWithReplies(reviewId);
      setReviews((prevReviews) =>
        prevReviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                review_replies: updatedReview.review_replies || [],
                replies: updatedReview.review_replies || [],
              }
            : r
        )
      );
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (reviewId: number, replyId: number) => {
    try {
      await deleteReply(reviewId, replyId);
      const updatedReview = await getReviewWithReplies(reviewId);
      setReviews((prevReviews) =>
        prevReviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                review_replies: updatedReview.review_replies || [],
                replies: updatedReview.review_replies || [],
              }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

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
                {t('nav.salonService')}
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
                {t('nav.products')}
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
        {/* Header Section with Stats */}
        <div className="reviews-header">
          <h1>{t('reviews.title')}</h1>
          <p>{t('reviews.subtitle')}</p>
          
          {!loading && reviews.length > 0 && (
            <div className="reviews-stats">
              <div className="stat">
                <div className="stat-rating">{averageRating}</div>
                <div className="stat-label">{t('reviews.averageRating')}</div>
                <div className="stars-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(parseFloat(averageRating as string)) ? '#ff6fa3' : '#ddd'}
                      color={i < Math.round(parseFloat(averageRating as string)) ? '#ff6fa3' : '#ddd'}
                    />
                  ))}
                </div>
              </div>
              <div className="stat">
                <div className="stat-number">{reviews.length}</div>
                <div className="stat-label">{t('reviews.totalReviews')}</div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ color: '#ff6fa3', fontSize: '1.2rem' }}>{t('reviews.loadingMessage')}</div>
          </div>
        )}

        {error && (
          <div style={{
            maxWidth: '900px',
            margin: '0 auto 2rem',
            padding: '1.5rem',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {!loading && reviews.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#999'
          }}>
            <p>No reviews yet. Be the first to leave a review!</p>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.map((review) => {
            const reviewUser = review.user || review.users;
            const replies = review.replies || review.review_replies || [];
            
            return (
              <div key={review.id} className="review-item">
                {/* Review Header */}
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {reviewUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="reviewer-name">{reviewUser?.name || 'Anonymous'}</div>
                      <div className="review-date">
                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      {review.service && (
                        <div className="review-service">Service: {review.service}</div>
                      )}
                    </div>
                  </div>
                  <div className="review-actions">
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < review.rating ? '#ff6fa3' : '#ddd'}
                          color={i < review.rating ? '#ff6fa3' : '#ddd'}
                        />
                      ))}
                    </div>
                    {currentUserId === reviewUser?.id && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="delete-btn"
                        title="Delete review"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Comment */}
                <div className="review-comment">{review.comment}</div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="replies-section">
                    <div className="replies-label">
                      <MessageCircle size={16} />
                      {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                    </div>
                    <div className="replies-list">
                      {replies.map((reply) => {
                        const replyUser = reply.user || reply.users;
                        const replyContent = reply.reply_text || reply.reply;
                        return (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-header">
                              <div className="reply-info">
                                <strong>{replyUser?.name || 'Admin'}</strong>
                                <span className="reply-date">
                                  {new Date(reply.created_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              {currentUserId === reply.user_id && (
                                <button
                                  onClick={() => handleDeleteReply(review.id, reply.id)}
                                  className="delete-reply-btn"
                                  title="Delete reply"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className="reply-text">{replyContent}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {currentUserId && currentUserId !== reviewUser?.id && (
                  <div className="reply-form-section">
                    {replyingToId !== review.id ? (
                      <button
                        onClick={() => setReplyingToId(review.id)}
                        className="reply-btn"
                      >
                        <MessageCircle size={16} />
                        Reply
                      </button>
                    ) : (
                      <div className="reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          rows={3}
                          disabled={submittingReply}
                        />
                        <div className="reply-form-actions">
                          <button
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            disabled={submittingReply}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReply(review.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="submit-btn"
                          >
                            {submittingReply ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
