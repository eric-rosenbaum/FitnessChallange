-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile and profiles of users in their groups
CREATE POLICY "Users can view profiles in their groups"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT gm2.user_id 
      FROM group_memberships gm1
      JOIN group_memberships gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Profiles are created via trigger when user signs up
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Groups policies
-- Members can view groups they belong to
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Any authenticated user can create a group (becomes admin)
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Group creator can update their groups
CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  USING (created_by = auth.uid());

-- Group memberships policies
-- Members can view memberships in their groups
CREATE POLICY "Members can view memberships in their groups"
  ON group_memberships FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Group members can add members (for invite flow)
CREATE POLICY "Group members can add members"
  ON group_memberships FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Only admins can update roles, but members can leave
CREATE POLICY "Admins can update roles, members can leave"
  ON group_memberships FOR UPDATE
  USING (
    user_id = auth.uid() OR -- Can leave own membership
    (group_id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Members can delete their own membership, admins can remove others
CREATE POLICY "Members can leave, admins can remove members"
  ON group_memberships FOR DELETE
  USING (
    user_id = auth.uid() OR -- Can leave own membership
    (group_id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    ))
  );

-- Week assignments policies
-- Members can view assignments in their groups
CREATE POLICY "Members can view week assignments"
  ON week_assignments FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Only admins can create/update/delete week assignments
CREATE POLICY "Admins can manage week assignments"
  ON week_assignments FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Week challenges policies
-- Members can view challenges in their groups
CREATE POLICY "Members can view challenges"
  ON week_challenges FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Only the assigned host can create challenges
CREATE POLICY "Hosts can create challenges"
  ON week_challenges FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    created_by = (
      SELECT host_user_id FROM week_assignments WHERE id = week_assignment_id
    )
  );

-- Only the host can update/delete their challenge
CREATE POLICY "Hosts can update their challenges"
  ON week_challenges FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Hosts can delete their challenges"
  ON week_challenges FOR DELETE
  USING (created_by = auth.uid());

-- Strength exercises policies
-- Members can view exercises for challenges in their groups
CREATE POLICY "Members can view exercises"
  ON strength_exercises FOR SELECT
  USING (
    week_challenge_id IN (
      SELECT id FROM week_challenges WHERE group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Only challenge creator (host) can manage exercises
CREATE POLICY "Hosts can manage exercises"
  ON strength_exercises FOR ALL
  USING (
    week_challenge_id IN (
      SELECT id FROM week_challenges WHERE created_by = auth.uid()
    )
  );

-- Workout logs policies
-- Members can view logs in their groups
CREATE POLICY "Members can view logs in their groups"
  ON workout_logs FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

-- Members can create logs for active challenges in their groups
CREATE POLICY "Members can create logs"
  ON workout_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    ) AND
    week_challenge_id IN (
      SELECT id FROM week_challenges WHERE group_id IN (
        SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Users can only update/delete their own logs
CREATE POLICY "Users can update own logs"
  ON workout_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own logs"
  ON workout_logs FOR DELETE
  USING (user_id = auth.uid());
