-- Audit log table for approval status changes
CREATE TABLE public.approval_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pending_approval_id UUID NOT NULL REFERENCES public.pending_approvals(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL,
  target_email TEXT NOT NULL,
  previous_status approval_status,
  new_status approval_status NOT NULL,
  assigned_role app_role,
  performed_by UUID,
  performed_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_audit_log_pending_id ON public.approval_audit_log(pending_approval_id);
CREATE INDEX idx_approval_audit_log_created_at ON public.approval_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.approval_audit_log ENABLE ROW LEVEL SECURITY;

-- Only Coordenação can read audit log
CREATE POLICY "Coordenacao can read audit log"
ON public.approval_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

-- Nobody can insert directly (only the trigger can, via SECURITY DEFINER)
CREATE POLICY "Deny direct insert on audit log"
ON public.approval_audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Nobody can update audit log
CREATE POLICY "Deny update on audit log"
ON public.approval_audit_log
FOR UPDATE
TO authenticated
USING (false);

-- Nobody can delete audit log
CREATE POLICY "Deny delete on audit log"
ON public.approval_audit_log
FOR DELETE
TO authenticated
USING (false);

-- Trigger function: records every status change on pending_approvals
CREATE OR REPLACE FUNCTION public.log_approval_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id UUID := auth.uid();
  actor_name TEXT;
BEGIN
  -- Only log when status actually changes
  IF TG_OP = 'INSERT' THEN
    -- Get actor display name (typically the user themselves on signup)
    SELECT COALESCE(display_name, email) INTO actor_name
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

    INSERT INTO public.approval_audit_log (
      pending_approval_id, target_user_id, target_email,
      previous_status, new_status, assigned_role,
      performed_by, performed_by_name
    ) VALUES (
      NEW.id, NEW.user_id, NEW.email,
      NULL, NEW.status, NEW.assigned_role,
      NEW.user_id, COALESCE(actor_name, NEW.email)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Resolve actor name from profiles
    IF NEW.approved_by IS NOT NULL THEN
      SELECT COALESCE(display_name, email) INTO actor_name
      FROM public.profiles
      WHERE user_id = NEW.approved_by
      LIMIT 1;
    END IF;

    INSERT INTO public.approval_audit_log (
      pending_approval_id, target_user_id, target_email,
      previous_status, new_status, assigned_role,
      performed_by, performed_by_name
    ) VALUES (
      NEW.id, NEW.user_id, NEW.email,
      OLD.status, NEW.status, NEW.assigned_role,
      NEW.approved_by, COALESCE(actor_name, 'Coordenação')
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_log_approval_status_change
AFTER INSERT OR UPDATE ON public.pending_approvals
FOR EACH ROW
EXECUTE FUNCTION public.log_approval_status_change();

-- Enable realtime for audit log so dialog updates live
ALTER TABLE public.approval_audit_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_audit_log;