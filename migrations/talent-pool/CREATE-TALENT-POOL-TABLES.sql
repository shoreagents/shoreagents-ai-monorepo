-- =====================================================
-- TALENT POOL - CLIENT RECRUITMENT SYSTEM
-- Created: October 20, 2025
-- Purpose: Enable clients to browse candidates and request interviews
-- =====================================================

-- Create enums for status tracking
CREATE TYPE interview_request_status AS ENUM ('pending', 'approved', 'rejected', 'scheduled');
CREATE TYPE scheduled_interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE interview_decision AS ENUM ('hire', 'reject', 'needs_review');

-- =====================================================
-- TABLE: interview_requests
-- Purpose: Store client requests to interview candidates
-- =====================================================
CREATE TABLE IF NOT EXISTS interview_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL,
    bpoc_candidate_id UUID NOT NULL,
    candidate_first_name TEXT NOT NULL,
    preferred_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    client_notes TEXT,
    status interview_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign key to client_users table
    CONSTRAINT fk_interview_requests_client
        FOREIGN KEY (client_user_id)
        REFERENCES client_users(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_requests_client ON interview_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_candidate ON interview_requests(bpoc_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_requests_created ON interview_requests(created_at DESC);

-- =====================================================
-- TABLE: scheduled_interviews
-- Purpose: Store confirmed interview schedules with Daily.co links
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_request_id UUID NOT NULL,
    client_user_id UUID NOT NULL,
    bpoc_candidate_id UUID NOT NULL,
    candidate_first_name TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    daily_co_room_url TEXT,
    daily_co_room_name TEXT,
    status scheduled_interview_status NOT NULL DEFAULT 'scheduled',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_scheduled_interviews_request
        FOREIGN KEY (interview_request_id)
        REFERENCES interview_requests(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_scheduled_interviews_client
        FOREIGN KEY (client_user_id)
        REFERENCES client_users(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_request ON scheduled_interviews(interview_request_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_client ON scheduled_interviews(client_user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_candidate ON scheduled_interviews(bpoc_candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_time ON scheduled_interviews(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON scheduled_interviews(status);

-- =====================================================
-- TABLE: interview_outcomes
-- Purpose: Store client feedback and hiring decisions after interviews
-- =====================================================
CREATE TABLE IF NOT EXISTS interview_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_interview_id UUID NOT NULL,
    client_user_id UUID NOT NULL,
    bpoc_candidate_id UUID NOT NULL,
    candidate_first_name TEXT NOT NULL,
    decision interview_decision NOT NULL,
    client_feedback TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_interview_outcomes_interview
        FOREIGN KEY (scheduled_interview_id)
        REFERENCES scheduled_interviews(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_interview_outcomes_client
        FOREIGN KEY (client_user_id)
        REFERENCES client_users(id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_outcomes_interview ON interview_outcomes(scheduled_interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_outcomes_client ON interview_outcomes(client_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_outcomes_candidate ON interview_outcomes(bpoc_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_outcomes_decision ON interview_outcomes(decision);
CREATE INDEX IF NOT EXISTS idx_interview_outcomes_created ON interview_outcomes(created_at DESC);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_talent_pool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for interview_requests
DROP TRIGGER IF EXISTS trigger_interview_requests_updated_at ON interview_requests;
CREATE TRIGGER trigger_interview_requests_updated_at
    BEFORE UPDATE ON interview_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_talent_pool_updated_at();

-- Trigger for scheduled_interviews
DROP TRIGGER IF EXISTS trigger_scheduled_interviews_updated_at ON scheduled_interviews;
CREATE TRIGGER trigger_scheduled_interviews_updated_at
    BEFORE UPDATE ON scheduled_interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_talent_pool_updated_at();

-- Trigger for interview_outcomes
DROP TRIGGER IF EXISTS trigger_interview_outcomes_updated_at ON interview_outcomes;
CREATE TRIGGER trigger_interview_outcomes_updated_at
    BEFORE UPDATE ON interview_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_talent_pool_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('interview_requests', 'scheduled_interviews', 'interview_outcomes')
ORDER BY tablename;

-- Verify indexes were created
SELECT 
    schemaname || '.' || tablename as table_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('interview_requests', 'scheduled_interviews', 'interview_outcomes')
ORDER BY tablename, indexname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Talent Pool tables created successfully!';
    RAISE NOTICE '📋 Created tables: interview_requests, scheduled_interviews, interview_outcomes';
    RAISE NOTICE '⚡ Created 15 performance indexes';
    RAISE NOTICE '🔄 Created auto-update triggers';
END $$;

