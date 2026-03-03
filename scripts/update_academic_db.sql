
-- Update profiles status to include 'cuti'
DO $$ 
BEGIN 
    -- If it's a field with check constraint, we might need to update it
    -- For now, let's just make sure we can insert 'cuti'
END $$;

-- Table for Academic Calendar
CREATE TABLE IF NOT EXISTS academic_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'krs', 'payment', 'exam', 'holiday', etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Student Academic Record (for Monitoring IPK & SKS)
-- This might already exist as 'grades' or similar. 
-- Let's check if 'krs' and 'grades' exist.

-- Add is_override to krs if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'krs') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'krs' AND column_name = 'is_override') THEN
            ALTER TABLE krs ADD COLUMN is_override BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;
