ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_comments;
ALTER TABLE public.incident_comments REPLICA IDENTITY FULL;