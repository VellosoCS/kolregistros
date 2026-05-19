INSERT INTO public.user_roles (user_id, role) VALUES ('42e1261b-98e4-4a51-9a9f-80f9db180c8d', 'coordenacao') ON CONFLICT (user_id, role) DO NOTHING;
DELETE FROM public.user_roles WHERE user_id = '42e1261b-98e4-4a51-9a9f-80f9db180c8d' AND role = 'suporte';
UPDATE public.pending_approvals SET assigned_role = 'coordenacao' WHERE user_id = '42e1261b-98e4-4a51-9a9f-80f9db180c8d';