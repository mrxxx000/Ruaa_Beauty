"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class ReviewService {
    supabaseInstance = null;
    constructor() { }
    getSupabase() {
        if (!this.supabaseInstance) {
            const url = process.env.SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE;
            if (!url || !key) {
                throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
            }
            this.supabaseInstance = (0, supabase_js_1.createClient)(url, key);
        }
        return this.supabaseInstance;
    }
    /**
     * Create a new review
     */
    async createReview(userId, rating, comment) {
        console.log(`📝 Creating review for user ${userId}: ${rating} stars, ${comment.substring(0, 50)}...`);
        // Validate input
        if (!userId || rating < 1 || rating > 5) {
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
            // First, get user details
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
        }
        catch (err) {
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
                .select(`
          id,
          user_id,
          rating,
          comment,
          created_at,
          users:user_id (id, name, email),
          review_replies (
            id,
            user_id,
            reply,
            created_at,
            users:user_id (id, name, email)
          )
        `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                console.error('❌ Failed to fetch reviews:', error);
                throw error;
            }
            console.log(`✅ Fetched ${reviews?.length || 0} reviews`);
            return {
                reviews: reviews || [],
                total: count || 0,
            };
        }
        catch (err) {
            console.error('❌ Error fetching reviews:', err);
            throw err;
        }
    }
    /**
     * Get reviews by user
     */
    async getReviewsByUserId(userId, limit = 10, offset = 0) {
        console.log(`🔍 Fetching reviews for user ${userId}`);
        try {
            const supabase = this.getSupabase();
            const { data: reviews, error, count } = await supabase
                .from('reviews')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                console.error('❌ Failed to fetch user reviews:', error);
                throw error;
            }
            console.log(`✅ Fetched ${reviews?.length || 0} reviews for user ${userId}`);
            return {
                reviews: reviews || [],
                total: count || 0,
            };
        }
        catch (err) {
            console.error('❌ Error fetching user reviews:', err);
            throw err;
        }
    }
    /**
     * Get review by ID with replies
     */
    async getReviewWithReplies(reviewId) {
        console.log(`🔍 Fetching review ${reviewId} with replies`);
        try {
            const supabase = this.getSupabase();
            const { data: review, error } = await supabase
                .from('reviews')
                .select(`
          id,
          user_id,
          rating,
          comment,
          created_at,
          users:user_id (id, name, email),
          review_replies (
            id,
            user_id,
            reply,
            created_at,
            users:user_id (id, name, email)
          )
        `)
                .eq('id', reviewId)
                .single();
            if (error) {
                console.error('❌ Failed to fetch review:', error);
                throw error;
            }
            console.log(`✅ Fetched review ${reviewId}`);
            return review;
        }
        catch (err) {
            console.error('❌ Error fetching review:', err);
            throw err;
        }
    }
    /**
     * Add a reply to a review
     */
    async addReplyToReview(reviewId, userId, reply) {
        console.log(`💬 Adding reply to review ${reviewId} from user ${userId}`);
        if (!reply || reply.trim().length === 0) {
            throw new Error('Reply cannot be empty');
        }
        if (reply.length > 500) {
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
                    reply: reply.trim(),
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
        }
        catch (err) {
            console.error('❌ Error creating reply:', err);
            throw err;
        }
    }
    /**
     * Update a review (only by the review author)
     */
    async updateReview(reviewId, userId, rating, comment) {
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
        }
        catch (err) {
            console.error('❌ Error updating review:', err);
            throw err;
        }
    }
    /**
     * Delete a review (only by the review author)
     */
    async deleteReview(reviewId, userId) {
        console.log(`🗑️  Deleting review ${reviewId}`);
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
                throw new Error('Not authorized to delete this review');
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
        }
        catch (err) {
            console.error('❌ Error deleting review:', err);
            throw err;
        }
    }
    /**
     * Delete a reply (only by the reply author)
     */
    async deleteReply(reviewId, replyId, userId) {
        console.log(`🗑️  Deleting reply ${replyId} from review ${reviewId}`);
        try {
            const supabase = this.getSupabase();
            // Verify the reply exists and ownership
            const { data: reply, error: fetchError } = await supabase
                .from('review_replies')
                .select('user_id')
                .eq('id', replyId)
                .eq('review_id', reviewId)
                .single();
            if (fetchError || !reply) {
                throw new Error('Reply not found');
            }
            if (reply.user_id !== userId) {
                throw new Error('Not authorized to delete this reply');
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
        }
        catch (err) {
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
            reviews.forEach((review) => {
                const rating = review.rating;
                ratingDistribution[rating]++;
                totalRating += rating;
            });
            const stats = {
                totalReviews: reviews.length,
                averageRating: (totalRating / reviews.length).toFixed(1),
                ratingDistribution,
            };
            console.log(`✅ Stats calculated:`, stats);
            return stats;
        }
        catch (err) {
            console.error('❌ Error calculating stats:', err);
            throw err;
        }
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=ReviewService.js.map