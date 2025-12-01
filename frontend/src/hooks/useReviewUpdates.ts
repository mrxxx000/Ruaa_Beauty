import { useEffect, useState, useCallback } from 'react';

interface ReviewUpdateEvent {
  type: 'review_deleted' | 'reply_deleted' | 'review_added' | 'reply_added';
  reviewId?: number;
  replyId?: number;
}

const reviewListeners: Set<(event: ReviewUpdateEvent) => void> = new Set();

export function useReviewUpdates() {
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = (event: ReviewUpdateEvent) => {
      setUpdateTrigger((prev) => prev + 1);
      // Dispatch custom event for other components
      window.dispatchEvent(
        new CustomEvent('reviewUpdated', { detail: event })
      );
    };

    reviewListeners.add(handleUpdate);

    return () => {
      reviewListeners.delete(handleUpdate);
    };
  }, []);

  const notifyReviewDeleted = useCallback((reviewId: number) => {
    const event: ReviewUpdateEvent = { type: 'review_deleted', reviewId };
    reviewListeners.forEach((listener) => listener(event));
    window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: event }));
  }, []);

  const notifyReplyDeleted = useCallback((reviewId: number, replyId: number) => {
    const event: ReviewUpdateEvent = { type: 'reply_deleted', reviewId, replyId };
    reviewListeners.forEach((listener) => listener(event));
    window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: event }));
  }, []);

  const notifyReviewAdded = useCallback((reviewId: number) => {
    const event: ReviewUpdateEvent = { type: 'review_added', reviewId };
    reviewListeners.forEach((listener) => listener(event));
    window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: event }));
  }, []);

  const notifyReplyAdded = useCallback((reviewId: number, replyId: number) => {
    const event: ReviewUpdateEvent = { type: 'reply_added', reviewId, replyId };
    reviewListeners.forEach((listener) => listener(event));
    window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: event }));
  }, []);

  return {
    notifyReviewDeleted,
    notifyReplyDeleted,
    notifyReviewAdded,
    notifyReplyAdded,
  };
}
