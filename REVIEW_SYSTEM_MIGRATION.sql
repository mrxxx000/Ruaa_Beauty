-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create review_replies table
CREATE TABLE IF NOT EXISTS review_replies (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON review_replies(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
-- Anyone can view reviews
CREATE POLICY "Allow public read reviews" ON reviews
  FOR SELECT
  TO public
  USING (true);

-- Users can only insert their own reviews
CREATE POLICY "Allow users to insert their own reviews" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1));

-- Users can only update their own reviews
CREATE POLICY "Allow users to update their own reviews" ON reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1))
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1));

-- Users can only delete their own reviews
CREATE POLICY "Allow users to delete their own reviews" ON reviews
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1));

-- Create RLS policies for review replies
-- Anyone can view replies
CREATE POLICY "Allow public read review replies" ON review_replies
  FOR SELECT
  TO public
  USING (true);

-- Users can only insert their own replies
CREATE POLICY "Allow users to insert their own replies" ON review_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1));
