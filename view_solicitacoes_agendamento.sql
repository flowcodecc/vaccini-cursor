-- View para facilitar consultas de solicitações com dados completos
CREATE OR REPLACE VIEW public.view_solicitacoes_agendamento AS
SELECT 
  sa.id,
  sa.user_id,
  u.nome as nome_usuario,
  u.email as email_usuario,
  u.celular as telefone_usuario,
  u.cep as cep_usuario,
  rv.nome as nome_vacina,
  un.nome as nome_unidade,
  CONCAT(un.endereco, ', ', un.numero, ' - ', un.bairro, ', ', un.cidade, ' - ', un.estado) as endereco_completo_unidade,
  un.telefone as telefone_unidade,
  sa.observacoes,
  sa.status,
  sa.prioridade,
  sa.data_solicitacao,
  sa.data_contato,
  sa.atendente_id,
  atendente.nome as nome_atendente,
  sa.observacoes_atendente,
  sa.created_at,
  sa.updated_at,
  -- Campos calculados
  CASE 
    WHEN sa.data_contato IS NULL THEN 
      EXTRACT(EPOCH FROM (now() - sa.data_solicitacao))/3600 -- Horas em espera
    ELSE NULL
  END as horas_em_espera,
  CASE 
    WHEN sa.status = 'pendente' AND sa.data_solicitacao < (now() - interval '24 hours') THEN true
    ELSE false
  END as atrasada
FROM solicitacoes_agendamento sa
LEFT JOIN "user" u ON sa.user_id = u.id
LEFT JOIN ref_vacinas rv ON sa.vacina_id = rv."ref_vacinasID"
LEFT JOIN unidade un ON sa.unidade_id = un.id
LEFT JOIN "user" atendente ON sa.atendente_id = atendente.id;

-- Função para buscar solicitações pendentes
CREATE OR REPLACE FUNCTION get_solicitacoes_pendentes()
RETURNS TABLE (
  id integer,
  nome_usuario varchar,
  email_usuario varchar,
  telefone_usuario varchar,
  nome_vacina varchar,
  nome_unidade varchar,
  prioridade varchar,
  data_solicitacao timestamp,
  horas_em_espera numeric,
  atrasada boolean
) 
LANGUAGE sql
AS $$
  SELECT 
    v.id,
    v.nome_usuario,
    v.email_usuario,
    v.telefone_usuario,
    v.nome_vacina,
    v.nome_unidade,
    v.prioridade,
    v.data_solicitacao,
    v.horas_em_espera,
    v.atrasada
  FROM view_solicitacoes_agendamento v
  WHERE v.status = 'pendente'
  ORDER BY 
    CASE v.prioridade 
      WHEN 'urgente' THEN 1
      WHEN 'alta' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'baixa' THEN 4
    END,
    v.data_solicitacao ASC;
$$;
