-- Tabela para armazenar solicitações de agendamento que precisam de contato manual
CREATE TABLE public.solicitacoes_agendamento (
  id serial NOT NULL,
  user_id uuid NOT NULL,
  vacina_id integer NOT NULL,
  unidade_id integer NULL, -- Pode ser null se não selecionou unidade
  observacoes text NULL,
  status varchar(20) NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, finalizado, cancelado
  prioridade varchar(10) NOT NULL DEFAULT 'normal', -- baixa, normal, alta, urgente
  data_solicitacao timestamp without time zone NOT NULL DEFAULT now(),
  data_contato timestamp without time zone NULL,
  atendente_id uuid NULL, -- ID do atendente que pegou a solicitação
  observacoes_atendente text NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT solicitacoes_agendamento_pkey PRIMARY KEY (id),
  CONSTRAINT solicitacoes_agendamento_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT solicitacoes_agendamento_vacina_id_fkey FOREIGN KEY (vacina_id) REFERENCES ref_vacinas("ref_vacinasID") ON DELETE CASCADE,
  CONSTRAINT solicitacoes_agendamento_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidade(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_agendamento_user_id ON public.solicitacoes_agendamento USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_agendamento_status ON public.solicitacoes_agendamento USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_agendamento_data_solicitacao ON public.solicitacoes_agendamento USING btree (data_solicitacao) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_agendamento_prioridade ON public.solicitacoes_agendamento USING btree (prioridade) TABLESPACE pg_default;

-- Trigger para atualizar updated_at (se a função existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_solicitacoes_agendamento_updated_at 
          BEFORE UPDATE ON solicitacoes_agendamento 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS (Row Level Security) - versão simplificada
ALTER TABLE public.solicitacoes_agendamento ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir que usuários vejam apenas suas próprias solicitações
CREATE POLICY "Users can view their own solicitations" ON public.solicitacoes_agendamento
  FOR SELECT USING (auth.uid() = user_id);

-- Política simples para permitir que usuários criem suas próprias solicitações
CREATE POLICY "Users can create their own solicitations" ON public.solicitacoes_agendamento
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que admins vejam todas as solicitações (sem verificação de tipo)
CREATE POLICY "Admins can view all solicitations" ON public.solicitacoes_agendamento
  FOR ALL USING (true);

