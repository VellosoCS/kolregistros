ALTER TABLE public.teacher_tracking
  ADD COLUMN IF NOT EXISTS third_message_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS third_message_date date,
  ADD COLUMN IF NOT EXISTS forwarded_to_coordination boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarded_to_coordination_date date;

-- Migrate existing message_stage=3 rows into third_message_sent for continuity
UPDATE public.teacher_tracking
SET third_message_sent = true,
    third_message_date = COALESCE(third_message_date, next_message_due, CURRENT_DATE)
WHERE message_stage = 3 AND third_message_sent = false;