
-- Alerts gerados automaticamente quando um professor atinge um nível na Sugestão Mês de Análise
CREATE TABLE public.mes_analise_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('observacao','alerta','critico')),
  total_count INTEGER NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  variations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_name, level)
);

CREATE INDEX idx_mes_analise_alerts_created_at ON public.mes_analise_alerts(created_at DESC);

ALTER TABLE public.mes_analise_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordenacao can read alerts"
  ON public.mes_analise_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenacao can insert alerts"
  ON public.mes_analise_alerts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenacao can delete alerts"
  ON public.mes_analise_alerts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));

-- Marcação de leitura por usuário
CREATE TABLE public.mes_analise_alert_reads (
  alert_id UUID NOT NULL REFERENCES public.mes_analise_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, user_id)
);

ALTER TABLE public.mes_analise_alert_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own alert reads"
  ON public.mes_analise_alert_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own alert reads"
  ON public.mes_analise_alert_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Users delete own alert reads"
  ON public.mes_analise_alert_reads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mes_analise_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mes_analise_alert_reads;
