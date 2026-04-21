ALTER TABLE public.pending_approvals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_approvals;