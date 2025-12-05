import { createClient } from '@supabase/supabase-js';

interface PointsCalculation {
  points: number;
  category: string;
}

export class LoyaltyPointsService {
  private supabaseInstance: any = null;

  // Points allocation rules
  private readonly POINTS_RULES = {
    'lash-lift': 10,
    'brow-lift': 10,
    'threading': 10,
    'makeup': 20,
    'bridal-makeup': 20,
    'mehendi': 0,
  };

  private readonly COMBINED_PACKAGE_POINTS = 15;
  private readonly REWARD_THRESHOLD = 100;
  private readonly REWARD_DISCOUNT_PERCENT = 10;

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
   * Calculate points based on services booked
   */
  calculatePoints(services: string[]): PointsCalculation {
    const normalizedServices = services.map(s => s.toLowerCase().trim());
    
    // Remove mehendi from consideration
    const eligibleServices = normalizedServices.filter(s => s !== 'mehendi');
    
    // No eligible services
    if (eligibleServices.length === 0) {
      return { points: 0, category: 'no_points' };
    }

    // Check for bridal makeup (highest priority)
    if (eligibleServices.includes('bridal-makeup') || eligibleServices.includes('bridal makeup')) {
      return { points: 20, category: 'bridal_makeup' };
    }

    // Check for event makeup
    if (eligibleServices.includes('makeup')) {
      return { points: 20, category: 'event_makeup' };
    }

    // Check for combined package (2+ eligible services)
    if (eligibleServices.length >= 2) {
      return { points: 15, category: 'combined_package' };
    }

    // Single basic service
    const service = eligibleServices[0];
    const points = this.POINTS_RULES[service as keyof typeof this.POINTS_RULES] || 10;
    return { points, category: 'basic_service' };
  }

  /**
   * Award points to a user after booking completion
   */
  async awardPoints(userId: number, bookingId: string, services: string[]): Promise<number> {
    const supabase = this.getSupabase();
    const calculation = this.calculatePoints(services);

    if (calculation.points === 0) {
      console.log(`No points to award for booking ${bookingId}`);
      return 0;
    }

    try {
      // Get current user points
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('loyalty_points')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      const currentPoints = user.loyalty_points || 0;
      const newBalance = currentPoints + calculation.points;

      // Update user points
      const { error: updateError } = await supabase
        .from('users')
        .update({ loyalty_points: newBalance })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update user points: ${updateError.message}`);
      }

      // Log transaction
      await this.logTransaction({
        userId,
        bookingId,
        pointsEarned: calculation.points,
        pointsSpent: 0,
        balanceAfter: newBalance,
        transactionType: 'earned',
        serviceType: calculation.category,
        notes: `Earned ${calculation.points} points from ${calculation.category}`,
      });

      // Update booking with points earned
      await supabase
        .from('bookings')
        .update({ loyalty_points_earned: calculation.points })
        .eq('id', bookingId);

      console.log(`✨ Awarded ${calculation.points} points to user ${userId}. New balance: ${newBalance}`);
      return calculation.points;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Redeem points for discount
   */
  async redeemPoints(userId: number, bookingId: string): Promise<{ success: boolean; discount: number }> {
    const supabase = this.getSupabase();

    try {
      // Get current user points
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('loyalty_points')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      const currentPoints = user.loyalty_points || 0;

      // Check if user has enough points
      if (currentPoints < this.REWARD_THRESHOLD) {
        return { success: false, discount: 0 };
      }

      // Deduct 100 points (the reward threshold)
      const newBalance = currentPoints - this.REWARD_THRESHOLD;
      const { error: updateError } = await supabase
        .from('users')
        .update({ loyalty_points: newBalance })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to deduct user points: ${updateError.message}`);
      }

      // Log transaction
      await this.logTransaction({
        userId,
        bookingId,
        pointsEarned: 0,
        pointsSpent: this.REWARD_THRESHOLD,
        balanceAfter: newBalance,
        transactionType: 'redeemed',
        serviceType: 'loyalty_reward',
        notes: `Redeemed ${this.REWARD_THRESHOLD} points for ${this.REWARD_DISCOUNT_PERCENT}% discount`,
      });

      console.log(`🎁 User ${userId} redeemed ${this.REWARD_THRESHOLD} points for ${this.REWARD_DISCOUNT_PERCENT}% discount (${newBalance} points remaining)`);
      return { success: true, discount: this.REWARD_DISCOUNT_PERCENT };
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }

  /**
   * Get user's current points balance
   */
  async getUserPoints(userId: number): Promise<{ points: number; canRedeem: boolean }> {
    const supabase = this.getSupabase();

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('loyalty_points')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user points: ${error.message}`);
      }

      const points = user.loyalty_points || 0;
      return {
        points,
        canRedeem: points >= this.REWARD_THRESHOLD,
      };
    } catch (error) {
      console.error('Error fetching user points:', error);
      throw error;
    }
  }

  /**
   * Get user's points transaction history
   */
  async getPointsHistory(userId: number, limit: number = 50): Promise<any[]> {
    const supabase = this.getSupabase();

    try {
      const { data, error } = await supabase
        .from('loyalty_points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch points history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching points history:', error);
      throw error;
    }
  }

  /**
   * Log a points transaction
   */
  private async logTransaction(transaction: {
    userId: number;
    bookingId: string;
    pointsEarned: number;
    pointsSpent: number;
    balanceAfter: number;
    transactionType: string;
    serviceType: string;
    notes: string;
  }): Promise<void> {
    const supabase = this.getSupabase();

    try {
      const { error } = await supabase
        .from('loyalty_points_transactions')
        .insert([
          {
            user_id: transaction.userId,
            booking_id: transaction.bookingId,
            points_earned: transaction.pointsEarned,
            points_spent: transaction.pointsSpent,
            balance_after: transaction.balanceAfter,
            transaction_type: transaction.transactionType,
            service_type: transaction.serviceType,
            notes: transaction.notes,
          },
        ]);

      if (error) {
        console.error('Failed to log transaction:', error);
      }
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  /**
   * Apply discount to booking price
   */
  applyDiscount(originalPrice: number, discountPercent: number): { discountedPrice: number; discountAmount: number } {
    const discountAmount = (originalPrice * discountPercent) / 100;
    const discountedPrice = originalPrice - discountAmount;
    return {
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }
}
