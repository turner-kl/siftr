-- siftr Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

-- User skill profiles
CREATE TABLE IF NOT EXISTS user_skill_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    skill_level VARCHAR(20) NOT NULL,
    interests JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_category CHECK (category IN ('technology', 'hr', 'business')),
    CONSTRAINT valid_skill_level CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    UNIQUE(user_id, category)
);

CREATE INDEX idx_user_skill_profiles_user_id ON user_skill_profiles(user_id);

-- Sources
CREATE TABLE IF NOT EXISTS sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    collection_frequency_minutes INT DEFAULT 60,
    last_collected_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_source_type CHECK (source_type IN ('rss', 'twitter', 'reddit', 'hackernews', 'manual'))
);

CREATE INDEX idx_sources_user_id ON sources(user_id);
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = true;
CREATE INDEX idx_sources_collection ON sources(last_collected_at) WHERE is_active = true;

-- Recommendation history
CREATE TABLE IF NOT EXISTS recommendation_history (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    article_id VARCHAR(255) NOT NULL,
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recommendation_type VARCHAR(50) NOT NULL,
    score DECIMAL(5,2),
    reason TEXT,
    user_action VARCHAR(20),
    user_rating INT,
    feedback_at TIMESTAMP,
    CONSTRAINT valid_recommendation_type CHECK (recommendation_type IN ('trending', 'personalized', 'skill_gap', 'related')),
    CONSTRAINT valid_user_action CHECK (user_action IS NULL OR user_action IN ('viewed', 'dismissed', 'saved', 'rated')),
    CONSTRAINT valid_rating CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5))
);

CREATE INDEX idx_recommendation_history_user_id ON recommendation_history(user_id);
CREATE INDEX idx_recommendation_history_article_id ON recommendation_history(article_id);
CREATE INDEX idx_recommendation_history_recommended_at ON recommendation_history(recommended_at DESC);

-- User interaction summary
CREATE TABLE IF NOT EXISTS user_interaction_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(50),
    total_views INT DEFAULT 0,
    total_read_time_seconds INT DEFAULT 0,
    articles_rated INT DEFAULT 0,
    avg_rating DECIMAL(3,2),
    top_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date, category)
);

CREATE INDEX idx_user_interaction_summary_user_date ON user_interaction_summary(user_id, date DESC);

-- AI analysis jobs
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ai_provider VARCHAR(20),
    priority INT DEFAULT 5,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_job_type CHECK (job_type IN ('summarize', 'categorize', 'extract_keywords', 'analyze_level')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_ai_provider CHECK (ai_provider IS NULL OR ai_provider IN ('openai', 'claude'))
);

CREATE INDEX idx_ai_analysis_jobs_status ON ai_analysis_jobs(status, priority DESC, created_at);
CREATE INDEX idx_ai_analysis_jobs_article_id ON ai_analysis_jobs(article_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skill_profiles_updated_at BEFORE UPDATE ON user_skill_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data
INSERT INTO users (cognito_sub, email, display_name, settings) VALUES
    ('local-test-user', 'test@siftr.local', 'Test User', '{"language": "ja", "timezone": "Asia/Tokyo"}')
ON CONFLICT (cognito_sub) DO NOTHING;

INSERT INTO user_skill_profiles (user_id, category, skill_level, interests)
SELECT user_id, 'technology', 'intermediate', '["backend", "cloud", "devops"]'::jsonb
FROM users WHERE cognito_sub = 'local-test-user'
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO user_skill_profiles (user_id, category, skill_level, interests)
SELECT user_id, 'hr', 'beginner', '["recruitment", "organization"]'::jsonb
FROM users WHERE cognito_sub = 'local-test-user'
ON CONFLICT (user_id, category) DO NOTHING;
