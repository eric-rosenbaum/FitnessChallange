-- Add member_type column to group_memberships table
-- Default is 'participant', can be 'spectator' or 'participant'
ALTER TABLE group_memberships
ADD COLUMN IF NOT EXISTS member_type TEXT NOT NULL DEFAULT 'participant' CHECK (member_type IN ('participant', 'spectator'));

-- Update existing rows to be participants (they already are, but ensure consistency)
UPDATE group_memberships
SET member_type = 'participant'
WHERE member_type IS NULL OR member_type NOT IN ('participant', 'spectator');
