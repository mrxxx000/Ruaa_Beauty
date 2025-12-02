import React, { useState } from 'react';
import '../styles/review-card.css';

interface User {
  id: number;
  name: string;
  email: string;
}

interface ReviewReply {
  id: number;
  user_id: number;
  reply_text?: string;
  reply?: string;
  created_at: string;
  user?: User;
  users?: User;
}

interface ReviewCardProps {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: User; // Changed from 'users' to 'user'
  users?: User; // Keep for backward compatibility
  replies?: ReviewReply[];
  currentUserId?: number;
  onReply?: (reviewId: number, reply: string) => Promise<void>;
  onDelete?: (reviewId: number) => Promise<void>;
  onDeleteReply?: (reviewId: number, replyId: number) => Promise<void>;
}

export default function ReviewCard({
  id,
  rating,
  comment,
  created_at,
  user,
  users,
  replies = [],
  currentUserId,
  onReply,
  onDelete,
  onDeleteReply,
}: ReviewCardProps) {
  // Support both 'user' and 'users' for backward compatibility
  const reviewUser = user || users;

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visibleReplies, setVisibleReplies] = useState(3);
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);

  // Return null if no user data
  if (!reviewUser) {
    return null;
  }

  const isAuthor = currentUserId === reviewUser.id;
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reply.trim()) {
      setError('Reply cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onReply) {
        await onReply(id, reply);
        setReply('');
        setShowReplyForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
      } catch (err) {
        console.error('Failed to delete review:', err);
      }
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        setDeletingReplyId(replyId);
        if (onDeleteReply) {
          await onDeleteReply(id, replyId);
        }
      } catch (err) {
        console.error('Failed to delete reply:', err);
      } finally {
        setDeletingReplyId(null);
      }
    }
  };

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {reviewUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="reviewer-name">{reviewUser.name}</h3>
            <p className="review-date">{formattedDate}</p>
          </div>
        </div>

        {isAuthor && onDelete && (
          <button
            className="delete-btn"
            onClick={handleDelete}
            title="Delete review"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Rating */}
      <div className="review-rating">
        <span className="stars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
        <span className="rating-text">{rating} out of 5</span>
      </div>

      {/* Comment */}
      <p className="review-comment">{comment}</p>

      {/* Replies Section */}
      {replies.length > 0 && (
        <div className="replies-section">
          <h4 className="replies-title">💬 Replies ({replies.length})</h4>
          <div className="replies-list">
            {replies.slice(0, visibleReplies).map((r) => {
              const replyUser = r.user || r.users;
              const replyText = r.reply_text || r.reply;
              if (!replyUser) return null;
              
              return (
              <div key={r.id} className="reply">
                <div className="reply-header">
                  <div className="reply-info">
                    <strong>{replyUser.name}</strong>
                    <span className="reply-date">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {currentUserId === r.user_id && onDeleteReply && (
                    <button
                      className="delete-reply-btn"
                      onClick={() => handleDeleteReply(r.id)}
                      disabled={deletingReplyId === r.id}
                      title="Delete reply"
                    >
                      {deletingReplyId === r.id ? '⏳' : '🗑️'}
                    </button>
                  )}
                </div>
                <p className="reply-text">{replyText}</p>
              </div>
            );
            })}
          </div>
          {visibleReplies < replies.length && (
            <button
              className="load-more-btn"
              onClick={() => setVisibleReplies(visibleReplies + 3)}
            >
              Load More ({replies.length - visibleReplies} remaining)
            </button>
          )}
        </div>
      )}

      {/* Reply Form */}
      {currentUserId && (
        <div className="reply-form-section">
          {!showReplyForm && (
            <button
              className="reply-btn"
              onClick={() => setShowReplyForm(true)}
            >
              💬 Reply
            </button>
          )}

          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="reply-form">
              {error && <div className="reply-error">{error}</div>}
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="reply-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReply('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || !reply.trim()}
                >
                  {isSubmitting ? '⏳ Sending...' : '✨ Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
