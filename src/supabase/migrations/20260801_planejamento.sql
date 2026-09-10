-- 20260801_planejamento.sql  (idempotente e auto-corretivo)
-- Seguro para rodar em banco novo OU que ja tenha tabelas antigas com esses nomes.
-- Corrige o erro "column ano does not exist": adiciona as colunas ausentes ANTES dos indices.

-- ============ vendedores_config ============
CREATE TABLE IF NOT EXISTS public.vendedores_config (codigo text PRIMARY KEY);
ALTER TABLE public.vendedores_config
  ADD COLUMN IF NOT EXISTS nome       text,
  ADD COLUMN IF NOT EXISTS setor      text DEFAULT 'Outros',
  ADD COLUMN IF NOT EXISTS ativo      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============ metas_vendedores ============
CREATE TABLE IF NOT EXISTS public.metas_vendedores (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.metas_vendedores
  ADD COLUMN IF NOT EXISTS codigo        text,
  ADD COLUMN IF NOT EXISTS ano           smallint,
  ADD COLUMN IF NOT EXISTS mes           smallint,
  ADD COLUMN IF NOT EXISTS meta          numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS venda_liquida numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- constraint unica necessaria para o upsert onConflict (codigo, ano, mes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'metas_vendedores_uk') THEN
    ALTER TABLE public.metas_vendedores ADD CONSTRAINT metas_vendedores_uk UNIQUE (codigo, ano, mes);
  END IF;
END $$;

-- ============ metas_historico (snapshots) ============
CREATE TABLE IF NOT EXISTS public.metas_historico (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.metas_historico
  ADD COLUMN IF NOT EXISTS ano        smallint,
  ADD COLUMN IF NOT EXISTS descricao  text,
  ADD COLUMN IF NOT EXISTS snapshot   jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- se a tabela for legada, solta o NOT NULL de colunas antigas para permitir gravar so o snapshot
DO $$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['codigo','mes','venda_liquida','valor_total','devolucoes'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='metas_historico' AND column_name=col AND is_nullable='NO'
    ) THEN
      EXECUTE format('ALTER TABLE public.metas_historico ALTER COLUMN %I DROP NOT NULL;', col);
    END IF;
  END LOOP;
END $$;

-- ============ indices ============
CREATE INDEX IF NOT EXISTS idx_metas_vendedores_ano_mes ON public.metas_vendedores (ano, mes);
CREATE INDEX IF NOT EXISTS idx_metas_historico_created  ON public.metas_historico  (created_at DESC);

-- ============ RLS + policies (idempotente) ============
ALTER TABLE public.vendedores_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_vendedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_historico   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vendedores_config','metas_vendedores','metas_historico'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "%s_all" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- ============ GRANTs ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendedores_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_vendedores  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_historico   TO anon, authenticated;
GRANT ALL ON public.vendedores_config TO service_role;
GRANT ALL ON public.metas_vendedores  TO service_role;
GRANT ALL ON public.metas_historico   TO service_role;

-- ============ grupos_financeiro (meta/realizado por grupo e mes) ============
CREATE TABLE IF NOT EXISTS public.grupos_financeiro (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.grupos_financeiro
  ADD COLUMN IF NOT EXISTS grupo      text,
  ADD COLUMN IF NOT EXISTS ano        smallint,
  ADD COLUMN IF NOT EXISTS mes        smallint,
  ADD COLUMN IF NOT EXISTS meta       numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS realizado  numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grupos_financeiro_uk') THEN
    ALTER TABLE public.grupos_financeiro ADD CONSTRAINT grupos_financeiro_uk UNIQUE (grupo, ano, mes);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_grupos_financeiro_ano_mes ON public.grupos_financeiro (ano, mes);
ALTER TABLE public.grupos_financeiro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grupos_financeiro_all" ON public.grupos_financeiro;
CREATE POLICY "grupos_financeiro_all" ON public.grupos_financeiro FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grupos_financeiro TO anon, authenticated;
GRANT ALL ON public.grupos_financeiro TO service_role;
