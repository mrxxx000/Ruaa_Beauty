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
  reply: string;
  created_at: string;
  users: User;
}

interface ReviewCardProps {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  users: User;
  replies?: ReviewReply[];
  currentUserId?: number;
  onReply?: (reviewId: number, reply: string) => Promise<void>;
  onDelete?: (reviewId: number) => Promise<void>;
}

export default function ReviewCard({
  id,
  rating,
  comment,
  created_at,
  users,
  replies = [],
  currentUserId,
  onReply,
  onDelete,
}: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAuthor = currentUserId === users.id;
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

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {users.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="reviewer-name">{users.name}</h3>
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
            {replies.map((r) => (
              <div key={r.id} className="reply">
                <div className="reply-header">
                  <strong>{r.users.name}</strong>
                  <span className="reply-date">
                    {new Date(r.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="reply-text">{r.reply}</p>
              </div>
            ))}
          </div>
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
