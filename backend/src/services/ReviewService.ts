import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export class ReviewService {
  private supabaseInstance: any = null;

  constructor() {}

  private getSupabase() {
    if (!this.supabaseInstance) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE;

      if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
      }

      this.supabaseInstance = createClient(url, key);
    }

    return this.supabaseInstance;
  }

  /**
   * Create a new review for a completed booking
   */
  async createReview(userId: number, bookingId: string, rating: number, comment: string) {
    console.log(`📝 Creating review for user ${userId} on booking ${bookingId}: ${rating} stars`);

    // Validate input
    if (!userId || !bookingId || rating < 1 || rating > 5) {
      throw new Error('Invalid rating. Must be between 1 and 5');
    }

    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    if (comment.length > 1000) {
      throw new Error('Comment cannot exceed 1000 characters');
    }

    try {
      const supabase = this.getSupabase();

      // Verify booking exists and belongs to user and is completed
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, service, user_id, status')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('This booking does not belong to you');
      }

      if (booking.status !== 'completed') {
        throw new Error('You can only review completed bookings');
      }

      // Check if user already reviewed this booking
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .single();

      if (existingReview) {
        throw new Error('You have already reviewed this booking');
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create review
      const { data: review, error } = await supabase
        .from('reviews')
        .insert([
          {
            user_id: userId,
            booking_id: bookingId,
            service: booking.service,
            rating,
            comment: comment.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error('❌ Failed to create review:', error);
        throw error;
      }

      console.log(`✅ Review created with ID: ${review?.[0]?.id}`);
      return review?.[0];
    } catch (err) {
      console.error('❌ Error creating review:', err);
      throw err;
    }
  }

  /**
   * Get all reviews with user details (for public page)
   */
  async getAllReviews(limit = 10, offset = 0) {
    console.log(`🔍 Fetching all reviews (limit: ${limit}, offset: ${offset})`);

    try {
      const supabase = this.getSupabase();

      const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select(
          `
          id,
          user_id,
          booking_id,
          service,
          rating,
          comment,
          created_at
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to fetch reviews:', error);
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      // If no reviews, return empty result
      if (!reviews || reviews.length === 0) {
        console.log(`✅ Fetched 0 reviews`);
        return {
          reviews: [],
          total: count || 0,
        };
      }

      // Fetch user details for each review and their replies
      const enrichedReviews = await Promise.all(
        reviews.map(async (review: any) => {
          try {
            // Get user details
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', review.user_id)
              .single();

            if (userError) {
              console.warn(`⚠️ Could not fetch user ${review.user_id}:`, userError.message);
            }

            // Get replies for this review
            const { data: replies, error: repliesError } = await supabase
              .from('review_replies')
              .select('id, user_id, reply_text, is_admin_reply, created_at')
              .eq('review_id', review.id)
              .order('created_at', { ascending: true });

            if (repliesError) {
              console.warn(`⚠️ Could not fetch replies for review ${review.id}:`, repliesError.message);
            }

            // Enrich replies with user data
            const enrichedReplies = await Promise.all(
              (replies || []).map(async (reply: any) => {
                const { data: replyUser, error: replyUserError } = await supabase
                  .from('users')
                  .select('id, name, email, role')
                  .eq('id', reply.user_id)
                  .single();

                if (replyUserError) {
                  console.warn(`⚠️ Could not fetch reply user ${reply.user_id}:`, replyUserError.message);
                }

                return {
                  ...reply,
                  user: replyUser || null,
                };
              })
            );

            return {
              ...review,
              user: user || null,
              replies: enrichedReplies,
            };
          } catch (reviewError: any) {
            console.error(`❌ Error processing review ${review.id}:`, reviewError?.message || reviewError);
            // Return review with minimal data on error
            return {
              ...review,
              user: null,
              replies: [],
            };
          }
        })
      );

      console.log(`✅ Fetched ${enrichedReviews.length} reviews`);
      return {
        reviews: enrichedReviews,
        total: count || 0,
      };
    } catch (err: any) {
      console.error('❌ Error fetching reviews:', err?.message || err);
      throw err;
    }
  }

  /**
   * Get reviews by user
   */
  async getReviewsByUserId(userId: number, limit = 10, offset = 0) {
    console.log(`🔍 Fetching reviews for user ${userId}`);

    try {
      const supabase = this.getSupabase();

      const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select('id, user_id, booking_id, service, rating, comment, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to fetch user reviews:', error);
        throw error;
      }

      // If no reviews, return empty result
      if (!reviews || reviews.length === 0) {
        console.log(`✅ Fetched 0 reviews for user ${userId}`);
        return {
          reviews: [],
          total: count || 0,
        };
      }

      // Fetch user details for each review and their replies
      const enrichedReviews = await Promise.all(
        reviews.map(async (review: any) => {
          try {
            // Get user details
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', review.user_id)
              .single();

            if (userError) {
              console.warn(`⚠️ Could not fetch user ${review.user_id}:`, userError);
            }

            // Get replies for this review
            const { data: replies, error: repliesError } = await supabase
              .from('review_replies')
              .select('id, user_id, reply_text, is_admin_reply, created_at')
              .eq('review_id', review.id)
              .order('created_at', { ascending: true });

            if (repliesError) {
              console.warn(`⚠️ Could not fetch replies for review ${review.id}:`, repliesError);
            }

            // Enrich replies with user data
            const enrichedReplies = await Promise.all(
              (replies || []).map(async (reply: any) => {
                const { data: replyUser, error: replyUserError } = await supabase
                  .from('users')
                  .select('id, name, email, role')
                  .eq('id', reply.user_id)
                  .single();

                if (replyUserError) {
                  console.warn(`⚠️ Could not fetch reply user ${reply.user_id}:`, replyUserError);
                }

                return {
                  ...reply,
                  user: replyUser || null,
                };
              })
            );

            return {
              ...review,
              user: user || null,
              replies: enrichedReplies,
            };
          } catch (reviewError) {
            console.error(`❌ Error processing review ${review.id}:`, reviewError);
            // Return review with minimal data on error
            return {
              ...review,
              user: null,
              replies: [],
            };
          }
        })
      );

      console.log(`✅ Fetched ${enrichedReviews.length} reviews for user ${userId}`);
      return {
        reviews: enrichedReviews,
        total: count || 0,
      };
    } catch (err) {
      console.error('❌ Error fetching user reviews:', err);
      throw err;
    }
  }

  /**
   * Get review by ID with replies
   */
  async getReviewWithReplies(reviewId: number) {
    console.log(`🔍 Fetching review ${reviewId} with replies`);

    try {
      const supabase = this.getSupabase();

      const { data: review, error } = await supabase
        .from('reviews')
        .select('id, user_id, booking_id, service, rating, comment, created_at')
        .eq('id', reviewId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch review:', error);
        throw error;
      }

      if (!review) {
        throw new Error('Review not found');
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', review.user_id)
        .single();

      if (userError) {
        console.warn(`⚠️ Could not fetch user ${review.user_id}:`, userError);
      }

      // Get replies
      const { data: replies, error: repliesError } = await supabase
        .from('review_replies')
        .select('id, user_id, reply_text, is_admin_reply, created_at')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.warn(`⚠️ Could not fetch replies for review ${reviewId}:`, repliesError);
      }

      // Enrich replies with user data
      const enrichedReplies = await Promise.all(
        (replies || []).map(async (reply: any) => {
          const { data: replyUser, error: replyUserError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', reply.user_id)
            .single();

          if (replyUserError) {
            console.warn(`⚠️ Could not fetch reply user ${reply.user_id}:`, replyUserError);
          }

          return {
            ...reply,
            user: replyUser || null,
          };
        })
      );

      console.log(`✅ Fetched review ${reviewId}`);
      return {
        ...review,
        user: user || null,
        replies: enrichedReplies,
      };
    } catch (err) {
      console.error('❌ Error fetching review:', err);
      throw err;
    }
  }

  /**
   * Add a reply to a review
   */
  async addReplyToReview(reviewId: number, userId: number, replyText: string, isAdminReply = false) {
    console.log(`💬 Adding reply to review ${reviewId} from user ${userId}`);

    if (!replyText || replyText.trim().length === 0) {
      throw new Error('Reply cannot be empty');
    }

    if (replyText.length > 500) {
      throw new Error('Reply cannot exceed 500 characters');
    }

    try {
      const supabase = this.getSupabase();

      // Verify review exists
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', reviewId)
        .single();

      if (reviewError || !review) {
        throw new Error('Review not found');
      }

      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Create reply
      const { data: replyData, error } = await supabase
        .from('review_replies')
        .insert([
          {
            review_id: reviewId,
            user_id: userId,
            reply_text: replyText.trim(),
            is_admin_reply: isAdminReply,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error('❌ Failed to create reply:', error);
        throw error;
      }

      console.log(`✅ Reply created with ID: ${replyData?.[0]?.id}`);
      return replyData?.[0];
    } catch (err) {
      console.error('❌ Error creating reply:', err);
      throw err;
    }
  }

  /**
   * Update a review (only by the review author)
   */
  async updateReview(reviewId: number, userId: number, rating: number, comment: string) {
    console.log(`📝 Updating review ${reviewId}`);

    if (rating < 1 || rating > 5) {
      throw new Error('Invalid rating. Must be between 1 and 5');
    }

    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    try {
      const supabase = this.getSupabase();

      // Verify ownership
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (fetchError || !review) {
        throw new Error('Review not found');
      }

      if (review.user_id !== userId) {
        throw new Error('Not authorized to update this review');
      }

      // Update review
      const { data: updatedReview, error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select();

      if (error) {
        console.error('❌ Failed to update review:', error);
        throw error;
      }

      console.log(`✅ Review ${reviewId} updated`);
      return updatedReview?.[0];
    } catch (err) {
      console.error('❌ Error updating review:', err);
      throw err;
    }
  }

  /**
   * Delete a review (only by the review author or admin)
   */
  async deleteReview(reviewId: number, userId: number) {
    console.log(`🗑️  Deleting review ${reviewId}`);

    try {
      const supabase = this.getSupabase();

      // Verify review exists
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (fetchError || !review) {
        throw new Error('Review not found');
      }

      // Check if user is the review author or an admin
      if (review.user_id !== userId) {
        // Check if the user is an admin
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          throw new Error('User not found');
        }

        if (user.role !== 'admin') {
          throw new Error('Not authorized to delete this review');
        }
      }

      // Delete replies first (cascade)
      await supabase.from('review_replies').delete().eq('review_id', reviewId);

      // Delete review
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) {
        console.error('❌ Failed to delete review:', error);
        throw error;
      }

      console.log(`✅ Review ${reviewId} deleted`);
      return { message: 'Review deleted successfully' };
    } catch (err) {
      console.error('❌ Error deleting review:', err);
      throw err;
    }
  }

  /**
   * Delete a reply (only by the reply author or admin)
   */
  async deleteReply(reviewId: number, replyId: number, userId: number) {
    console.log(`🗑️  Deleting reply ${replyId} from review ${reviewId}`);

    try {
      const supabase = this.getSupabase();

      // Verify the reply exists
      const { data: reply, error: fetchError } = await supabase
        .from('review_replies')
        .select('user_id')
        .eq('id', replyId)
        .eq('review_id', reviewId)
        .single();

      if (fetchError || !reply) {
        throw new Error('Reply not found');
      }

      // Check if user is the reply author or an admin
      if (reply.user_id !== userId) {
        // Check if the user is an admin
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          throw new Error('User not found');
        }

        if (user.role !== 'admin') {
          throw new Error('Not authorized to delete this reply');
        }
      }

      // Delete reply
      const { error } = await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId);

      if (error) {
        console.error('❌ Failed to delete reply:', error);
        throw error;
      }

      console.log(`✅ Reply ${replyId} deleted`);
      return { message: 'Reply deleted successfully' };
    } catch (err) {
      console.error('❌ Error deleting reply:', err);
      throw err;
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStats() {
    console.log(`📊 Calculating review statistics`);

    try {
      const supabase = this.getSupabase();

      // Get all reviews
      const { data: reviews, error } = await supabase.from('reviews').select('rating');

      if (error) {
        console.error('❌ Failed to fetch reviews:', error);
        throw error;
      }

      if (!reviews || reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        };
      }

      const ratingDistribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      let totalRating = 0;

      reviews.forEach((review: any) => {
        const rating = review.rating;
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++;
        totalRating += rating;
      });

      const stats = {
        totalReviews: reviews.length,
        averageRating: (totalRating / reviews.length).toFixed(1),
        ratingDistribution,
      };

      console.log(`✅ Stats calculated:`, stats);
      return stats;
    } catch (err) {
      console.error('❌ Error calculating stats:', err);
      throw err;
    }
  }
}
