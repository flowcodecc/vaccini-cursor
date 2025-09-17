import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Message {
  text: string;
  type: 'bot' | 'user';
  options?: {
    text: string;
    value: string;
    action: () => void;
  }[];
  component?: React.ReactNode;
}

interface UserData {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cep: string;
}

interface DependenteData {
  nome: string;
  data_nascimento: string;
  parentesco: string;
  sexo: string;
  documento: string;
}

interface Unidade {
  id: number;
  nome: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
  email?: string;
  horario_funcionamento?: string;
}

interface Vacina {
  id: number;
  nome: string;
  preco: number;
  total_doses: number;
  valor_plano?: number | null;
  tem_convenio?: boolean;
  status?: string;
  preco_customizado?: number;
}

interface AgendamentoData {
  vacina_id: number;
  vacina_nome: string;
  preco: number;
  data: string;
  horario: string;
  forma_pagamento_id: number;
  forma_pagamento_nome: string;
}

const PublicChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('greeting');
  const [userData, setUserData] = useState<UserData>({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cep: ''
  });
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const selectedUnidadeRef = useRef<Unidade | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserData | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState<'usuario' | 'dependente' | null>(null);
  const [dependentesData, setDependentesData] = useState<DependenteData[]>([]);
  const [dependenteAtual, setDependenteAtual] = useState<DependenteData>({
    nome: '',
    data_nascimento: '',
    parentesco: '',
    sexo: '',
    documento: ''
  });
  const [editingDependente, setEditingDependente] = useState(false);
  const [editingDependenteField, setEditingDependenteField] = useState<keyof DependenteData | null>(null);
  const [dependenteSelecionado, setDependenteSelecionado] = useState<DependenteData | null>(null);
  const [vacinasDisponiveis, setVacinasDisponiveis] = useState<Vacina[]>([]);
  const [agendamentoData, setAgendamentoData] = useState<AgendamentoData>({
    vacina_id: 0,
    vacina_nome: '',
    preco: 0,
    data: '',
    horario: '',
    forma_pagamento_id: 0,
    forma_pagamento_nome: ''
  });
  
  // Ref para manter dados do agendamento de forma síncrona
  const agendamentoDataRef = useRef<AgendamentoData>({
    vacina_id: 0,
    vacina_nome: '',
    preco: 0,
    data: '',
    horario: '',
    forma_pagamento_id: 0,
    forma_pagamento_nome: ''
  });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<{id: number, nome: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref para manter dados do usuário de forma síncrona
  const userDataRef = useRef<UserData>({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cep: ''
  });

  // Ref para manter dados dos dependentes de forma síncrona
  const dependentesDataRef = useRef<DependenteData[]>([]);
  const dependenteAtualRef = useRef<DependenteData>({
    nome: '',
    data_nascimento: '',
    parentesco: '',
    sexo: '',
    documento: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, type: 'bot' | 'user', options?: Message['options']) => {
    setMessages(prev => [...prev, { text, type, options }]);
    setTimeout(scrollToBottom, 100);
  };

  const addMessageWithComponent = (component: React.ReactNode) => {
    setMessages(prev => [...prev, { text: '', type: 'bot', component }]);
    setTimeout(scrollToBottom, 100);
  };

  // Função para buscar vacinas disponíveis na unidade com lógica de convênio
  const buscarVacinasUnidade = async (unidadeId: number): Promise<Vacina[]> => {
    try {
      console.log('=== BUSCANDO VACINAS DA UNIDADE COM CONVÊNIO ===');
      console.log('Unidade ID:', unidadeId);

      // Primeiro, buscar vacinas básicas da view
      const { data: vacinasBasicas, error: errorVacinas } = await supabase
        .from('vw_vacinas_esquemas')
        .select('*')
        .eq('status', 'Ativo');

      if (errorVacinas) {
        console.error('Erro ao buscar vacinas básicas:', errorVacinas);
        return [];
      }

      if (!vacinasBasicas || vacinasBasicas.length === 0) {
        console.log('Nenhuma vacina encontrada');
        return [];
      }

      // Buscar preços de convênio para as vacinas
      const vacinaIds = vacinasBasicas.map(v => v.vacina_id);
      
      const { data: precosConvenio, error: errorConvenio } = await supabase
        .from('convenio_vacina_precos')
        .select(`
          vacina_id,
          preco,
          convenios!inner(nome)
        `)
        .in('vacina_id', vacinaIds)
        .eq('ativo', true);

      if (errorConvenio) {
        console.error('Erro ao buscar preços de convênio:', errorConvenio);
      }

      // Combinar dados das vacinas com informações de convênio
      const vacinasComConvenio = vacinasBasicas.map(vaccine => {
        const precosVacina = precosConvenio?.filter(p => p.vacina_id === vaccine.vacina_id);
        
        // Filtrar apenas preços > 0 para calcular o mínimo
        const precosValidos = precosVacina?.filter(p => p.preco > 0) || [];
        const precoMinimo = precosValidos.length > 0 
          ? Math.min(...precosValidos.map(p => p.preco))
          : null;
        
        // Considerar que tem convênio se há preços válidos (> 0)
        const temConvenio = precosValidos.length > 0;
        
        return {
          id: vaccine.vacina_id,
          nome: vaccine.vacina_nome,
          preco: vaccine.preco,
          total_doses: vaccine.total_doses,
          valor_plano: precoMinimo,
          tem_convenio: temConvenio,
          status: vaccine.status
        };
      });

      // Filtrar vacinas que têm dose = 0 ou preço = 0 (não configuradas)
      const vacinasConfiguradas = vacinasComConvenio.filter(vaccine => 
        vaccine.total_doses > 0 && vaccine.preco > 0
      );

      console.log('Vacinas com convênio configuradas:', vacinasConfiguradas);
      return vacinasConfiguradas;

    } catch (error) {
      console.error('Erro inesperado ao buscar vacinas:', error);
      return [];
    }
  };

  // Função para buscar horários disponíveis da unidade
  const buscarHorariosUnidade = async (unidadeId: number, diaSemana: string): Promise<string[]> => {
    try {
      console.log('=== BUSCANDO HORÁRIOS DA UNIDADE ===');
      console.log('Unidade ID:', unidadeId);
      console.log('Dia da semana:', diaSemana);

      // Usar RPC para evitar problemas de RLS
      const { data: horarios, error } = await supabase.rpc('get_horarios_unidade', {
        p_unidade_id: unidadeId,
        p_dia_semana: diaSemana
      });

      console.log('Horários resultado RPC:', { data: horarios, error });

      if (error) {
        console.error('Erro na RPC get_horarios_unidade:', error);
        return [];
      }

      // Gerar horários disponíveis baseado no horário de funcionamento
      const horariosDisponiveis: string[] = [];
      
      if (horarios && horarios.length > 0) {
        console.log('Processando horários encontrados:', horarios);
        
        horarios.forEach((horario: any) => {
          const inicio = horario.horario_inicio.split(':');
          const fim = horario.horario_fim.split(':');
          
          const horaInicio = parseInt(inicio[0]);
          const minutoInicio = parseInt(inicio[1]);
          const horaFim = parseInt(fim[0]);
          const minutoFim = parseInt(fim[1]);
          
          console.log(`Processando horário: ${horaInicio}:${minutoInicio} até ${horaFim}:${minutoFim}`);
          
          // Gerar horários de 30 em 30 minutos
          for (let h = horaInicio; h < horaFim; h++) {
            for (let m = (h === horaInicio ? minutoInicio : 0); m < 60; m += 30) {
              if (h === horaFim - 1 && m >= minutoFim) break;
              
              const horarioFormatado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              horariosDisponiveis.push(horarioFormatado);
            }
          }
        });
      } else {
        console.log('Nenhum horário específico encontrado, usando horários padrão');
        // Horários padrão se não houver configuração específica
        for (let h = 8; h < 18; h++) {
          for (let m = 0; m < 60; m += 30) {
            const horarioFormatado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            horariosDisponiveis.push(horarioFormatado);
          }
        }
      }

      console.log('Horários disponíveis gerados:', horariosDisponiveis);
      return horariosDisponiveis;
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      return [];
    }
  };

  // Função para buscar formas de pagamento
  const buscarFormasPagamento = async (): Promise<{id: number, nome: string}[]> => {
    try {
      const { data: formas, error } = await supabase
        .from('ref_formas_pagamentos')
        .select('id, nome');

      if (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        return [];
      }

      return formas || [];
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return [];
    }
  };

  // Função para salvar agendamento
  const salvarAgendamento = async (dadosAgendamento: AgendamentoData, userId: string, unidadeId: number, dependenteId?: string): Promise<boolean> => {
    try {
      console.log('=== SALVANDO AGENDAMENTO ===');
      console.log('Dados:', dadosAgendamento);
      console.log('User ID:', userId);
      console.log('Unidade ID:', unidadeId);
      console.log('Dependente ID:', dependenteId);

      const agendamento = {
        user_id: userId,
        unidade_id: unidadeId,
        vacinas_id: [dadosAgendamento.vacina_id],
        dia: dadosAgendamento.data,
        horario: dadosAgendamento.horario,
        forma_pagamento_id: dadosAgendamento.forma_pagamento_id,
        valor_total: dadosAgendamento.preco,
        status_id: 1, // Assumindo que 1 é "Agendado"
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('agendamento')
        .insert(agendamento);

      if (error) {
        console.error('Erro ao salvar agendamento:', error);
        addMessage(`❌ Erro ao salvar agendamento: ${error.message}`, 'bot');
        return false;
      }

      console.log('Agendamento salvo com sucesso');
      return true;

    } catch (error) {
      console.error('Erro inesperado ao salvar agendamento:', error);
      addMessage('❌ Erro inesperado ao salvar agendamento. Tente novamente.', 'bot');
      return false;
    }
  };

  // Função para verificar quais unidades atendem o CEP (replicando a lógica do Schedule.tsx)
  const verificarUnidadesPorCEP = async (cep: string): Promise<Unidade[]> => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      console.log('=== DEBUG VERIFICAR UNIDADES POR CEP ===');
      console.log('CEP original:', cep);
      console.log('CEP limpo:', cepLimpo);
      
      // Primeiro, tentar buscar unidades que atendem o CEP usando RPC
      const { data: unidadesCEP, error: errorPermitidas } = await supabase
        .rpc('get_unidades_por_cep', {
          user_cep: cepLimpo
        });

      console.log('Resultado RPC get_unidades_por_cep:');
      console.log('data:', unidadesCEP);
      console.log('error:', errorPermitidas);

      let unitIds: number[] = [];

      if (errorPermitidas) {
        console.error('Erro na RPC get_unidades_por_cep:', errorPermitidas);
        
        // Se a RPC falhar, tentar buscar por faixas de CEP manualmente
        console.log('Tentando busca manual por faixas de CEP...');
        
        // Buscar todas as unidades e suas faixas de CEP
        const { data: todasUnidades, error: errorTodasUnidades } = await supabase
          .from('unidade')
          .select('id, nome, status')
          .eq('status', true);
        
        if (errorTodasUnidades) {
          console.error('Erro ao buscar todas as unidades:', errorTodasUnidades);
          addMessage(`❌ Erro ao buscar unidades: ${errorTodasUnidades.message}`, 'bot');
          return [];
        }

        // Para teste específico do CEP 20030030, incluir unidade do Largo do Machado
        const cepNumerico = parseInt(cepLimpo.substring(0, 5)); // Pega os 5 primeiros dígitos: 20030
        console.log('CEP numérico para comparação:', cepNumerico);
        
        // Definir faixas conhecidas por estado (baseado na imagem fornecida)
        const faixasCEP = [
          { inicio: 20010, fim: 20012, unidades: ['Vaccini Centro'], estado: 'RJ', cidade: 'Rio de Janeiro' },
          { inicio: 20020, fim: 20022, unidades: ['Vaccini Copacabana'], estado: 'RJ', cidade: 'Rio de Janeiro' },
          { inicio: 20030, fim: 20033, unidades: ['Vaccini LARGO DO MACHADO'], estado: 'RJ', cidade: 'Rio de Janeiro' },
          { inicio: 20040, fim: 20041, unidades: ['Vaccini Ipanema'], estado: 'RJ', cidade: 'Rio de Janeiro' }
        ];
        
        console.log('Faixas de CEP definidas:', faixasCEP);
        
        // Encontrar faixa que atende o CEP
        const faixaEncontrada = faixasCEP.find(faixa => 
          cepNumerico >= faixa.inicio && cepNumerico <= faixa.fim
        );
        
        console.log('Faixa encontrada:', faixaEncontrada);
        
        if (faixaEncontrada && todasUnidades) {
          // Primeiro, buscar todas as unidades com detalhes para filtrar por estado
          const { data: unidadesCompletas, error: errorCompletas } = await supabase
            .from('unidade')
            .select('*')
            .eq('status', true);
          
          if (errorCompletas || !unidadesCompletas) {
            console.error('Erro ao buscar unidades completas:', errorCompletas);
            unitIds = [];
          } else {
            // Buscar unidades que correspondem aos nomes da faixa E estão no mesmo estado
            const unidadesEncontradas = unidadesCompletas.filter(unidade => {
              const nomeMatch = faixaEncontrada.unidades.some(nomeUnidade => 
                unidade.nome.toLowerCase().includes(nomeUnidade.toLowerCase().replace('Vaccini ', ''))
              );
              const estadoMatch = unidade.estado === faixaEncontrada.estado || 
                                  unidade.estado === faixaEncontrada.estado.toLowerCase() ||
                                  (faixaEncontrada.estado === 'RJ' && (unidade.estado === 'Rio de Janeiro' || unidade.estado === 'RJ'));
              
              console.log(`Unidade: ${unidade.nome}, Estado: ${unidade.estado}, Nome Match: ${nomeMatch}, Estado Match: ${estadoMatch}`);
              
              return nomeMatch && estadoMatch;
            });
            
            console.log('Unidades encontradas por nome e estado:', unidadesEncontradas);
            unitIds = unidadesEncontradas.map(u => u.id);
          }
        }
        
        if (unitIds.length === 0) {
          console.log('Nenhuma unidade encontrada para o CEP via busca manual');
          
          // Tentar buscar pelo menos unidades do mesmo estado baseado no CEP
          let estadoCEP = '';
          if (cepLimpo.startsWith('20') || cepLimpo.startsWith('21') || cepLimpo.startsWith('22') || cepLimpo.startsWith('23') || cepLimpo.startsWith('24') || cepLimpo.startsWith('25') || cepLimpo.startsWith('26') || cepLimpo.startsWith('27') || cepLimpo.startsWith('28')) {
            estadoCEP = 'RJ'; // Rio de Janeiro
          } else if (cepLimpo.startsWith('30') || cepLimpo.startsWith('31') || cepLimpo.startsWith('32') || cepLimpo.startsWith('33') || cepLimpo.startsWith('34') || cepLimpo.startsWith('35') || cepLimpo.startsWith('36') || cepLimpo.startsWith('37') || cepLimpo.startsWith('38') || cepLimpo.startsWith('39')) {
            estadoCEP = 'MG'; // Minas Gerais
          }
          
          if (estadoCEP) {
            // Buscar unidades do mesmo estado
            const { data: unidadesEstado, error: errorEstado } = await supabase
              .from('unidade')
              .select('id, nome, estado')
              .eq('status', true);
            
            if (!errorEstado && unidadesEstado) {
              const unidadesMesmoEstado = unidadesEstado.filter(unidade => 
                unidade.estado === estadoCEP || 
                unidade.estado === estadoCEP.toLowerCase() ||
                (estadoCEP === 'RJ' && (unidade.estado === 'Rio de Janeiro' || unidade.estado === 'RJ')) ||
                (estadoCEP === 'MG' && (unidade.estado === 'Minas Gerais' || unidade.estado === 'MG'))
              );
              
              console.log(`Unidades encontradas no estado ${estadoCEP}:`, unidadesMesmoEstado);
              
              if (unidadesMesmoEstado.length > 0) {
                unitIds = unidadesMesmoEstado.map(u => u.id);
                addMessage(`🔍 Não encontrei unidades específicas para seu CEP, mas encontrei unidades em ${estadoCEP === 'RJ' ? 'Rio de Janeiro' : 'Minas Gerais'}:`, 'bot');
              } else {
                addMessage('🔍 Não encontrei unidades cadastradas para sua região.', 'bot');
                addMessage('Mas vou mostrar todas as unidades disponíveis para você escolher:', 'bot');
                unitIds = (todasUnidades || []).map(u => u.id);
              }
            } else {
              addMessage('🔍 Não encontrei unidades cadastradas para sua região específica.', 'bot');
              addMessage('Mas vou mostrar todas as unidades disponíveis para você escolher:', 'bot');
              unitIds = (todasUnidades || []).map(u => u.id);
            }
          } else {
            addMessage('🔍 Não encontrei unidades cadastradas para sua região específica.', 'bot');
            addMessage('Mas vou mostrar todas as unidades disponíveis para você escolher:', 'bot');
            unitIds = (todasUnidades || []).map(u => u.id);
          }
        }
        
      } else if (!unidadesCEP || unidadesCEP.length === 0) {
        console.log('RPC retornou vazio - Nenhuma unidade encontrada para o CEP');
        
        // Tentar buscar pelo menos unidades do mesmo estado baseado no CEP
        let estadoCEP = '';
        if (cepLimpo.startsWith('20') || cepLimpo.startsWith('21') || cepLimpo.startsWith('22') || cepLimpo.startsWith('23') || cepLimpo.startsWith('24') || cepLimpo.startsWith('25') || cepLimpo.startsWith('26') || cepLimpo.startsWith('27') || cepLimpo.startsWith('28')) {
          estadoCEP = 'RJ'; // Rio de Janeiro
        } else if (cepLimpo.startsWith('30') || cepLimpo.startsWith('31') || cepLimpo.startsWith('32') || cepLimpo.startsWith('33') || cepLimpo.startsWith('34') || cepLimpo.startsWith('35') || cepLimpo.startsWith('36') || cepLimpo.startsWith('37') || cepLimpo.startsWith('38') || cepLimpo.startsWith('39')) {
          estadoCEP = 'MG'; // Minas Gerais
        }
        
        // Buscar unidades do mesmo estado ou todas como fallback
        const { data: todasUnidades, error: errorTodasUnidades } = await supabase
          .from('unidade')
          .select('*')
          .eq('status', true);
        
        if (!errorTodasUnidades && todasUnidades) {
          if (estadoCEP) {
            const unidadesMesmoEstado = todasUnidades.filter(unidade => 
              unidade.estado === estadoCEP || 
              unidade.estado === estadoCEP.toLowerCase() ||
              (estadoCEP === 'RJ' && (unidade.estado === 'Rio de Janeiro' || unidade.estado === 'RJ')) ||
              (estadoCEP === 'MG' && (unidade.estado === 'Minas Gerais' || unidade.estado === 'MG'))
            );
            
            if (unidadesMesmoEstado.length > 0) {
              unitIds = unidadesMesmoEstado.map(u => u.id);
              addMessage(`🔍 Não encontrei unidades específicas para seu CEP, mas encontrei unidades em ${estadoCEP === 'RJ' ? 'Rio de Janeiro' : 'Minas Gerais'}:`, 'bot');
            } else {
              unitIds = todasUnidades.map(u => u.id);
              addMessage('🔍 Não encontrei unidades específicas para sua região, mas vou mostrar todas as opções disponíveis:', 'bot');
            }
          } else {
            unitIds = todasUnidades.map(u => u.id);
            addMessage('🔍 Não encontrei unidades específicas para sua região, mas vou mostrar todas as opções disponíveis:', 'bot');
          }
        }
        
      } else {
        // RPC funcionou normalmente
        unitIds = unidadesCEP.map((u: any) => u.unidade_id);
      }

      console.log('IDs das unidades finais:', unitIds);
      
      if (unitIds.length === 0) {
        return [];
      }
      
      // Buscar detalhes das unidades
      const { data: todasUnidades, error: errorUnidades } = await supabase
        .from('unidade')
        .select('*')
        .in('id', unitIds)
        .eq('status', true);

      console.log('Resultado consulta unidades:');
      console.log('data:', todasUnidades);
      console.log('error:', errorUnidades);

      if (errorUnidades) {
        console.error('Erro ao carregar dados das unidades:', errorUnidades);
        addMessage(`❌ Erro ao carregar dados das unidades: ${errorUnidades.message}`, 'bot');
        return [];
      }

      // Converter para o formato esperado
      const unidadesFormatadas = (todasUnidades || []).map(unit => ({
        id: unit.id,
        nome: unit.nome,
        endereco: unit.logradouro || unit.endereco || '',
        numero: unit.numero || '',
        bairro: unit.bairro || '',
        cidade: unit.cidade || '',
        estado: unit.estado || '',
        telefone: unit.telefone || '',
        email: unit.email || '',
        horario_funcionamento: 'Segunda a Sexta: 8h às 18h'
      }));

      console.log('Unidades formatadas:', unidadesFormatadas);
      console.log('===========================================');
      
      return unidadesFormatadas;

    } catch (error) {
      console.error('Erro ao verificar unidades por CEP:', error);
      addMessage(`❌ Erro inesperado: ${error.message}`, 'bot');
      return [];
    }
  };

  // Validações
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarTelefone = (telefone: string): boolean => {
    const telefoneNumerico = telefone.replace(/\D/g, '');
    return telefoneNumerico.length >= 10;
  };

  const validarCEP = (cep: string): boolean => {
    const cepNumerico = cep.replace(/\D/g, '');
    return cepNumerico.length === 8;
  };

  const validarSenha = (senha: string): boolean => {
    return senha.length >= 6;
  };

  const validarDocumento = (documento: string): boolean => {
    const docNumerico = documento.replace(/\D/g, '');
    return docNumerico.length === 11; // CPF
  };

  const validarDataNascimento = (data: string): boolean => {
    if (!data || data === '') return false;
    
    try {
      const nascimento = new Date(data);
      const hoje = new Date();
      
      // Verificar se a data é válida (não é NaN)
      if (isNaN(nascimento.getTime())) return false;
      
      // Data deve ser no passado
      if (nascimento > hoje) return false;
      
      // Data não pode ser muito antiga (mais de 150 anos)
      const anoMinimo = hoje.getFullYear() - 150;
      if (nascimento.getFullYear() < anoMinimo) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Função para cadastrar usuário no Supabase
  const cadastrarUsuario = async (dadosUsuario: UserData): Promise<boolean> => {
    try {
      console.log('=== CADASTRANDO USUÁRIO ===');
      console.log('Dados do usuário:', dadosUsuario);
      
      // Primeiro, criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dadosUsuario.email,
        password: dadosUsuario.senha,
        options: {
          data: {
            nome: dadosUsuario.nome,
            telefone: dadosUsuario.telefone,
            cep: dadosUsuario.cep
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar conta:', authError);
        if (authError.message.includes('already registered')) {
          addMessage('❌ Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.', 'bot', [
            {
              text: '🔑 Fazer Login',
              value: 'login',
              action: () => iniciarLoginIntegrado()
            },
            {
              text: '✏️ Usar Outro E-mail',
              value: 'novo-email',
              action: () => editarCampo('email')
            },
            {
              text: '🔄 Começar Novamente',
              value: 'reiniciar',
              action: () => reiniciarChat()
            }
          ]);
        } else {
          addMessage(`❌ Erro ao criar conta: ${authError.message}`, 'bot');
        }
        return false;
      }

      if (!authData.user) {
        addMessage('❌ Erro inesperado ao criar conta. Tente novamente.', 'bot');
        return false;
      }

      // Inserir dados na tabela user (obrigatório para agendamentos)
      try {
        const { error: userError } = await supabase
          .from('user')
          .insert({
            id: authData.user.id,
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            celular: dadosUsuario.telefone,
            cep: dadosUsuario.cep,
            created_at: new Date().toISOString()
          });

        if (userError) {
          console.error('Erro ao inserir na tabela user:', userError);
          addMessage(`❌ Erro ao criar perfil do usuário: ${userError.message}`, 'bot');
          return false;
        }
      } catch (userError) {
        console.error('Erro ao inserir na tabela user:', userError);
        addMessage('❌ Erro ao criar perfil do usuário. Tente novamente.', 'bot');
        return false;
      }

      // Inserir dados adicionais na tabela de perfis (se existir)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            telefone: dadosUsuario.telefone,
            cep: dadosUsuario.cep,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('Erro ao inserir perfil (tabela pode não existir):', profileError);
        }
      } catch (profileError) {
        console.warn('Tabela profiles não existe ou erro ao inserir:', profileError);
      }

      console.log('Usuário cadastrado com sucesso:', authData.user.id);
      addMessage('✅ Cadastro realizado com sucesso! ', 'bot');
      return true;
      
    } catch (error) {
      console.error('Erro inesperado ao cadastrar usuário:', error);
      addMessage('❌ Erro inesperado ao realizar cadastro. Tente novamente.', 'bot');
      return false;
    }
  };

  // Função para cadastrar dependente no Supabase
  const cadastrarDependente = async (dadosUsuario: UserData, dadosDependente: DependenteData): Promise<boolean> => {
    try {
      console.log('=== CADASTRANDO DEPENDENTE ===');
      console.log('Dados do usuário:', dadosUsuario);
      console.log('Dados do dependente:', dadosDependente);

      // Primeiro cadastrar o usuário principal se ainda não foi cadastrado
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dadosUsuario.email,
        password: dadosUsuario.senha,
        options: {
          data: {
            nome: dadosUsuario.nome,
            telefone: dadosUsuario.telefone,
            cep: dadosUsuario.cep
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar conta do responsável:', authError);
        if (authError.message.includes('already registered')) {
          // Se usuário já existe, tentar fazer login para pegar o ID
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: dadosUsuario.email,
            password: dadosUsuario.senha
          });
          
          if (loginError) {
            addMessage('❌ Este e-mail já está cadastrado com senha diferente. Tente fazer login ou use outro e-mail.', 'bot', [
              {
                text: '🔑 Fazer Login',
                value: 'login',
                action: () => iniciarLoginIntegrado()
              },
              {
                text: '✏️ Usar Outro E-mail',
                value: 'novo-email',
                action: () => editarCampo('email')
              },
              {
                text: '🔄 Começar Novamente',
                value: 'reiniciar',
                action: () => reiniciarChat()
              }
            ]);
            return false;
          }
          
          if (loginData.user) {
            // Verificar se usuário existe na tabela user, se não, inserir
            const { data: userExists } = await supabase
              .from('user')
              .select('id')
              .eq('id', loginData.user.id)
              .single();
            
            if (!userExists) {
              await supabase
                .from('user')
                .insert({
                  id: loginData.user.id,
                  nome: dadosUsuario.nome,
                  email: dadosUsuario.email,
                  celular: dadosUsuario.telefone,
                  cep: dadosUsuario.cep,
                  created_at: new Date().toISOString()
                });
            }
            
            // Cadastrar dependente com usuário existente
            return await inserirDependente(loginData.user.id, dadosDependente);
          }
        } else {
          addMessage(`❌ Erro ao criar conta do responsável: ${authError.message}`, 'bot');
        }
        return false;
      }

      if (!authData.user) {
        addMessage('❌ Erro inesperado ao criar conta do responsável. Tente novamente.', 'bot');
        return false;
      }

      // Inserir dados na tabela user (obrigatório para agendamentos)
      try {
        const { error: userError } = await supabase
          .from('user')
          .insert({
            id: authData.user.id,
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            celular: dadosUsuario.telefone,
            cep: dadosUsuario.cep,
            created_at: new Date().toISOString()
          });

        if (userError) {
          console.error('Erro ao inserir na tabela user:', userError);
          addMessage(`❌ Erro ao criar perfil do usuário: ${userError.message}`, 'bot');
          return false;
        }
      } catch (userError) {
        console.error('Erro ao inserir na tabela user:', userError);
        addMessage('❌ Erro ao criar perfil do usuário. Tente novamente.', 'bot');
        return false;
      }

      // Cadastrar dependente
      const sucessoDependente = await inserirDependente(authData.user.id, dadosDependente);
      
      if (sucessoDependente) {
        addMessage('✅ Cadastro do responsável e dependente realizado com sucesso! ', 'bot');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Erro inesperado ao cadastrar dependente:', error);
      addMessage('❌ Erro inesperado ao realizar cadastro. Tente novamente.', 'bot');
      return false;
    }
  };

  const inserirDependente = async (userId: string, dadosDependente: DependenteData): Promise<boolean> => {
    try {
      console.log('=== INSERINDO DEPENDENTE ===');
      console.log('UserId:', userId);
      console.log('Dados do dependente a serem inseridos:', dadosDependente);
      
      const dadosInsercao = {
        user_id: userId,
        nome: dadosDependente.nome,
        data_nascimento: dadosDependente.data_nascimento,
        parentesco: dadosDependente.parentesco,
        sexo: dadosDependente.sexo,
        documento: dadosDependente.documento,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Objeto final de inserção:', dadosInsercao);
      
      const { error: dependenteError } = await supabase
        .from('dependentes')
        .insert(dadosInsercao);

      if (dependenteError) {
        console.error('Erro ao cadastrar dependente:', dependenteError);
        addMessage(`❌ Erro ao cadastrar dependente: ${dependenteError.message}`, 'bot');
        return false;
      }

      console.log('Dependente cadastrado com sucesso');
      return true;
      
    } catch (error) {
      console.error('Erro ao inserir dependente:', error);
      return false;
    }
  };

  // Função para iniciar login integrado no chat
  const iniciarLoginIntegrado = (emailPreenchido?: string) => {
    addMessage('🔑 Perfeito! Vamos fazer o login aqui mesmo.', 'bot');
    
    // Se já temos o email, ir direto para senha
    if (emailPreenchido || userDataRef.current.email) {
      const emailParaLogin = emailPreenchido || userDataRef.current.email;
      addMessage(`E-mail: ${emailParaLogin}`, 'bot');
      addMessage('Digite sua senha:', 'bot');
      
      const senhaInput = (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              id="login-senha-direct-input"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
              ref={(input) => {
                if (input) {
                  setTimeout(() => input.focus(), 100);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    addMessage('*'.repeat(value.length), 'user');
                    handleLoginSenha(emailParaLogin, value);
                  } else {
                    toast.error('Por favor, digite sua senha');
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('login-senha-direct-input') as HTMLInputElement;
                const value = input.value.trim();
                if (value) {
                  addMessage('*'.repeat(value.length), 'user');
                  handleLoginSenha(emailParaLogin, value);
                } else {
                  toast.error('Por favor, digite sua senha');
                }
              }}
              className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
            >
              Entrar
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => iniciarEsqueciSenha(emailParaLogin)}
              className="text-sm text-[#009688] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      );
      addMessageWithComponent(senhaInput);
      return;
    }
    
    // Se não temos email, pedir
    addMessage('Digite seu e-mail:', 'bot');
    
    const emailInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
            <input
              id="login-email-input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
              ref={(input) => {
                if (input) {
                  setTimeout(() => input.focus(), 100);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && validarEmail(value)) {
                    addMessage(value, 'user');
                    handleLoginEmail(value);
                  } else {
                    toast.error('Por favor, digite um e-mail válido');
                  }
                }
              }}
            />
          <button
            onClick={() => {
              const input = document.getElementById('login-email-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarEmail(value)) {
                addMessage(value, 'user');
                handleLoginEmail(value);
              } else {
                toast.error('Por favor, digite um e-mail válido');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Continuar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(emailInput);
  };

  // Função para lidar com email do login
  const handleLoginEmail = (email: string) => {
    addMessage('Agora digite sua senha:', 'bot');
    
    const senhaInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="login-senha-input"
            type="password"
            placeholder="Digite sua senha"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  addMessage('*'.repeat(value.length), 'user');
                  handleLoginSenha(email, value);
                } else {
                  toast.error('Por favor, digite sua senha');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('login-senha-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value) {
                addMessage('*'.repeat(value.length), 'user');
                handleLoginSenha(email, value);
              } else {
                toast.error('Por favor, digite sua senha');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Entrar
          </button>
        </div>
        <div className="text-center">
          <button
            onClick={() => iniciarEsqueciSenha(email)}
            className="text-sm text-[#009688] hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(senhaInput);
  };

  // Função para lidar com senha do login
  const handleLoginSenha = async (email: string, senha: string) => {
    addMessage('🔐 Verificando suas credenciais...', 'bot');
    
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (loginError) {
        console.error('Erro no login:', loginError);
        if (loginError.message.includes('Invalid login credentials')) {
          addMessage('❌ E-mail ou senha incorretos. Tente novamente.', 'bot', [
            {
              text: '🔄 Tentar Novamente',
              value: 'tentar-novamente',
              action: () => iniciarLoginIntegrado()
            },
            {
              text: '🔑 Esqueci a Senha',
              value: 'esqueci-senha',
              action: () => iniciarEsqueciSenha(email)
            },
            {
              text: '✏️ Usar Outro E-mail',
              value: 'novo-email',
              action: () => editarCampo('email')
            }
          ]);
        } else {
          addMessage(`❌ Erro no login: ${loginError.message}`, 'bot');
        }
        return;
      }

      if (!loginData.user) {
        addMessage('❌ Erro inesperado no login. Tente novamente.', 'bot');
        return;
      }

      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (userError || !userData) {
        addMessage('❌ Erro ao buscar dados do usuário. Tente novamente.', 'bot');
        return;
      }

      // Atualizar dados do usuário no chat
      userDataRef.current = {
        nome: userData.nome || '',
        email: userData.email || email,
        senha: senha,
        telefone: userData.celular || '',
        cep: userData.cep || ''
      };

      addMessage(`✅ Login realizado com sucesso! Bem-vindo(a), ${userData.nome}!`, 'bot');
      addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
      
      // Verificar se tem dependentes e oferecer opções de gerenciamento
      setTimeout(async () => {
        await verificarDependentesEOferercerOpcoes(loginData.user.id, userData);
      }, 2000);

    } catch (error) {
      console.error('Erro inesperado no login:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  // Função para verificar dependentes e oferecer opções para usuários logados
  const verificarDependentesEOferercerOpcoes = async (userId: string, userData: any) => {
    try {
      // Buscar dependentes existentes
      const { data: dependentes, error } = await supabase
        .from('dependentes')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Erro ao buscar dependentes:', error);
        // Prosseguir normalmente se der erro
        prosseguirParaBuscarUnidades();
        return;
      }
      
      if (dependentes && dependentes.length > 0) {
        // Usuário tem dependentes
        dependentesDataRef.current = dependentes.map(dep => ({
          nome: dep.nome,
          data_nascimento: dep.data_nascimento,
          parentesco: dep.parentesco,
          sexo: dep.sexo,
          documento: dep.documento
        }));
        
        addMessage(`👥 Você tem ${dependentes.length} dependente(s) cadastrado(s):`, 'bot');
        
        dependentes.forEach((dep, index) => {
          addMessage(`${index + 1}. ${dep.nome} (${dep.parentesco})`, 'bot');
        });
        
        setTimeout(() => {
          addMessage('O que você gostaria de fazer?', 'bot', [
            {
              text: '👤 Agendar para Mim',
              value: 'agendar-usuario',
              action: () => {
                setTipoAtendimento('usuario');
                addMessage('Agendar para mim', 'user');
                prosseguirParaBuscarUnidades();
              }
            },
            {
              text: '👥 Agendar para Dependente',
              value: 'agendar-dependente',
              action: () => escolherDependenteParaAgendamento(dependentes)
            },
            {
              text: '➕ Cadastrar Novo Dependente',
              value: 'novo-dependente',
              action: () => {
                addMessage('Cadastrar novo dependente', 'user');
                addMessage('Vou te ajudar a cadastrar um novo dependente.', 'bot');
                setTimeout(() => {
                  iniciarCadastroNovoDependente();
                }, 1000);
              }
            },
            {
              text: '✏️ Gerenciar Dependentes',
              value: 'gerenciar-dependentes',
              action: () => mostrarOpcoesGerenciamento(dependentes)
            },
            {
              text: '📋 Ver Meus Dados',
              value: 'ver-dados',
              action: () => mostrarDadosUsuario(userData)
            }
          ]);
        }, 1000);
        
      } else {
        // Usuário não tem dependentes no banco, mas pode ter cadastrado na sessão atual
        const temDependentesNaSessao = dependentesDataRef.current.length > 0;
        
        if (temDependentesNaSessao) {
          addMessage(`👥 Você tem ${dependentesDataRef.current.length} dependente(s) cadastrado(s) nesta sessão:`, 'bot');
          
          dependentesDataRef.current.forEach((dep, index) => {
            addMessage(`${index + 1}. ${dep.nome} (${dep.parentesco})`, 'bot');
          });
          
          setTimeout(() => {
            addMessage('O que você gostaria de fazer?', 'bot', [
              {
                text: '👤 Agendar para Mim',
                value: 'agendar-usuario',
                action: () => {
                  setTipoAtendimento('usuario');
                  addMessage('Agendar para mim', 'user');
                  prosseguirParaBuscarUnidades();
                }
              },
              {
                text: '👥 Agendar para Dependente',
                value: 'agendar-dependente',
                action: () => escolherDependenteParaAgendamento(dependentesDataRef.current)
              },
              {
                text: '➕ Cadastrar Novo Dependente',
                value: 'novo-dependente',
                action: () => {
                  addMessage('Cadastrar novo dependente', 'user');
                  addMessage('Vou te ajudar a cadastrar um novo dependente.', 'bot');
                  setTimeout(() => {
                    iniciarCadastroNovoDependente();
                  }, 1000);
                }
              },
              {
                text: '📋 Ver Meus Dados',
                value: 'ver-dados',
                action: () => mostrarDadosUsuario(userData)
              }
            ]);
          }, 1000);
        } else {
          addMessage('Você ainda não tem dependentes cadastrados.', 'bot');
          
          setTimeout(() => {
            addMessage('O que você gostaria de fazer?', 'bot', [
              {
                text: '👤 Agendar para Mim',
                value: 'agendar-usuario',
                action: () => {
                  setTipoAtendimento('usuario');
                  addMessage('Agendar para mim', 'user');
                  prosseguirParaBuscarUnidades();
                }
              },
              {
                text: '👥 Cadastrar Dependentes',
                value: 'cadastrar-dependentes',
                action: () => {
                  addMessage('Cadastrar dependentes', 'user');
                  addMessage('Ótimo! Vou te ajudar a cadastrar seus dependentes.', 'bot');
                  setTimeout(() => {
                    iniciarCadastroNovoDependente();
                  }, 1000);
                }
              },
              {
                text: '📋 Ver Meus Dados',
                value: 'ver-dados',
                action: () => mostrarDadosUsuario(userData)
              }
            ]);
          }, 1000);
        }
      }
      
    } catch (error) {
      console.error('Erro inesperado ao verificar dependentes:', error);
      prosseguirParaBuscarUnidades();
    }
  };

  // Função para mostrar dados do usuário
  const mostrarDadosUsuario = (userData: any) => {
    addMessage('📋 Ver Meus Dados', 'user');
    addMessage('📋 Seus dados cadastrados:', 'bot');
    
    const dadosFormatados = `👤 Nome: ${userData.nome}
📧 E-mail: ${userData.email}
📱 Celular: ${userData.celular || 'Não informado'}
📍 CEP: ${userData.cep}
📅 Cadastrado em: ${new Date(userData.created_at).toLocaleDateString('pt-BR')}`;

    addMessage(dadosFormatados, 'bot');
    
    setTimeout(() => {
      addMessage('O que você gostaria de fazer agora?', 'bot', [
        {
          text: '👤 Agendar para Mim',
          value: 'agendar-usuario',
          action: () => {
            setTipoAtendimento('usuario');
            addMessage('Agendar para mim', 'user');
            prosseguirParaBuscarUnidades();
          }
        },
        {
          text: '📍 Alterar CEP',
          value: 'alterar-cep',
          action: () => alterarCEPUsuario(userData)
        },
        {
          text: '👥 Ver Dependentes',
          value: 'ver-dependentes',
          action: async () => {
            // Recarregar dependentes
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await verificarDependentesEOferercerOpcoes(user.id, userData);
            }
          }
        },
        {
          text: '🔄 Voltar ao Menu',
          value: 'voltar-menu',
          action: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await verificarDependentesEOferercerOpcoes(user.id, userData);
            }
          }
        }
      ]);
    }, 1000);
  };

  // Função para alterar CEP do usuário
  const alterarCEPUsuario = (userData: any) => {
    addMessage('📍 Alterar CEP', 'user');
    addMessage(`CEP atual: ${userData.cep}`, 'bot');
    addMessage('Digite o novo CEP:', 'bot');
    
    const cepInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="alterar-cep-input"
            name="postal-code"
            type="text"
            autoComplete="postal-code"
            placeholder="Digite o novo CEP (ex: 01234567)"
            maxLength={9}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            ref={(input) => {
              if (input) {
                setTimeout(() => input.focus(), 100);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarCEP(value)) {
                  addMessage(value, 'user');
                  confirmarAlteracaoCEP(value, userData);
                } else {
                  toast.error('Por favor, digite um CEP válido (8 dígitos)');
                }
              }
            }}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
              }
              e.target.value = value;
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('alterar-cep-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarCEP(value)) {
                addMessage(value, 'user');
                confirmarAlteracaoCEP(value, userData);
              } else {
                toast.error('Por favor, digite um CEP válido (8 dígitos)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Alterar
          </button>
        </div>
        <button
          onClick={() => mostrarDadosUsuario(userData)}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Cancelar
        </button>
      </div>
    );
    addMessageWithComponent(cepInput);
  };

  // Função para confirmar alteração de CEP
  const confirmarAlteracaoCEP = async (novoCEP: string, userData: any) => {
    try {
      addMessage('🔄 Atualizando seu CEP...', 'bot');
      
      // Buscar informações do novo CEP via ViaCEP
      const cepNumerico = novoCEP.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
      const cepData = await response.json();
      
      if (cepData.erro) {
        addMessage('❌ CEP não encontrado. Verifique se digitou corretamente.', 'bot');
        addMessage('Tente novamente:', 'bot');
        alterarCEPUsuario(userData);
        return;
      }
      
      addMessage(`📍 Novo endereço encontrado: ${cepData.logradouro}, ${cepData.bairro} - ${cepData.localidade}/${cepData.uf}`, 'bot');
      
      // Atualizar CEP no banco de dados
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Erro de autenticação. Faça login novamente.', 'bot');
        return;
      }
      
      const { error } = await supabase
        .from('user')
        .update({ cep: novoCEP })
        .eq('id', user.id);
      
      if (error) {
        console.error('Erro ao atualizar CEP:', error);
        addMessage('❌ Erro ao atualizar CEP no sistema. Tente novamente.', 'bot');
        return;
      }
      
      // Atualizar dados locais
      userDataRef.current.cep = novoCEP;
      const userDataAtualizado = { ...userData, cep: novoCEP };
      
      addMessage('✅ CEP atualizado com sucesso!', 'bot');
      
      setTimeout(() => {
        addMessage('🔍 Quer ver as novas unidades disponíveis para sua região?', 'bot', [
          {
            text: '🏥 Ver Unidades da Nova Região',
            value: 'ver-unidades',
            action: () => {
              addMessage('Ver unidades da nova região', 'user');
              addMessage('🔍 Buscando unidades que atendem sua nova região...', 'bot');
              setTimeout(() => {
                setStep('verificando');
                handleCEPSubmit(novoCEP);
              }, 1000);
            }
          },
          {
            text: '📋 Ver Dados Atualizados',
            value: 'ver-dados-atualizados',
            action: () => mostrarDadosUsuario(userDataAtualizado)
          },
          {
            text: '🔄 Voltar ao Menu',
            value: 'voltar-menu',
            action: async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await verificarDependentesEOferercerOpcoes(user.id, userDataAtualizado);
              }
            }
          }
        ]);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao alterar CEP:', error);
      addMessage('❌ Erro inesperado ao alterar CEP. Tente novamente.', 'bot');
    }
  };

  // Função para escolher dependente para agendamento
  const escolherDependenteParaAgendamento = (dependentes: any[]) => {
    addMessage('Agendar para dependente', 'user');
    addMessage('Para qual dependente você gostaria de agendar?', 'bot');
    
    const opcoes = dependentes.map((dep, index) => ({
      text: `👥 ${dep.nome} (${dep.parentesco})`,
      value: `dependente-${index}`,
      action: () => {
        setTipoAtendimento('dependente');
        setDependenteSelecionado({
          nome: dep.nome,
          data_nascimento: dep.data_nascimento,
          parentesco: dep.parentesco,
          sexo: dep.sexo,
          documento: dep.documento
        });
        addMessage(`${dep.nome} (${dep.parentesco})`, 'user');
        prosseguirParaBuscarUnidades();
      }
    }));
    
    addMessage('Escolha um dependente:', 'bot', opcoes);
  };

  // Função para mostrar opções de gerenciamento de dependentes
  const mostrarOpcoesGerenciamento = (dependentes: any[]) => {
    addMessage('Gerenciar dependentes', 'user');
    addMessage('👥 Gerenciamento de Dependentes:', 'bot');
    
    dependentes.forEach((dep, index) => {
      addMessage(
        `${index + 1}. ${dep.nome}\n📅 Nascimento: ${new Date(dep.data_nascimento).toLocaleDateString('pt-BR')}\n👥 Parentesco: ${dep.parentesco}\n⚧ Sexo: ${dep.sexo === 'M' ? 'Masculino' : 'Feminino'}\n📄 CPF: ${dep.documento}`,
        'bot',
        [
          {
            text: '💉 Agendar para este',
            value: `agendar-${index}`,
            action: () => {
              setTipoAtendimento('dependente');
              setDependenteSelecionado({
                nome: dep.nome,
                data_nascimento: dep.data_nascimento,
                parentesco: dep.parentesco,
                sexo: dep.sexo,
                documento: dep.documento
              });
              addMessage(`Agendar para ${dep.nome}`, 'user');
              prosseguirParaBuscarUnidades();
            }
          }
        ]
      );
    });
    
    setTimeout(() => {
      addMessage('Outras opções:', 'bot', [
        {
          text: '➕ Cadastrar Novo Dependente',
          value: 'novo-dependente',
          action: () => {
            addMessage('Cadastrar novo dependente', 'user');
            addMessage('Vou te ajudar a cadastrar um novo dependente.', 'bot');
            setTimeout(() => {
              iniciarCadastroNovoDependente();
            }, 1000);
          }
        },
        {
          text: '👤 Agendar para Mim',
          value: 'agendar-usuario',
          action: () => {
            setTipoAtendimento('usuario');
            addMessage('Agendar para mim', 'user');
            prosseguirParaBuscarUnidades();
          }
        }
      ]);
    }, 1000);
  };

  // Função para iniciar processo de esqueci a senha
  const iniciarEsqueciSenha = (email?: string) => {
    addMessage('🔑 Vou te ajudar a recuperar sua senha.', 'bot');
    
    if (email) {
      addMessage(`Vou enviar um link de recuperação para: ${email}`, 'bot');
      addMessage('Confirma este e-mail?', 'bot', [
        {
          text: '✅ Sim, enviar',
          value: 'enviar-recuperacao',
          action: () => enviarRecuperacaoSenha(email)
        },
        {
          text: '✏️ Usar outro e-mail',
          value: 'outro-email',
          action: () => solicitarEmailRecuperacao()
        }
      ]);
    } else {
      solicitarEmailRecuperacao();
    }
  };

  // Função para solicitar email para recuperação
  const solicitarEmailRecuperacao = () => {
    addMessage('Digite o e-mail cadastrado:', 'bot');
    
    const emailInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="recuperacao-email-input"
            type="email"
            placeholder="Digite seu e-mail"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarEmail(value)) {
                  addMessage(value, 'user');
                  enviarRecuperacaoSenha(value);
                } else {
                  toast.error('Por favor, digite um e-mail válido');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('recuperacao-email-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarEmail(value)) {
                addMessage(value, 'user');
                enviarRecuperacaoSenha(value);
              } else {
                toast.error('Por favor, digite um e-mail válido');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(emailInput);
  };

  // Função para enviar recuperação de senha
  const enviarRecuperacaoSenha = async (email: string) => {
    addMessage('📧 Enviando link de recuperação...', 'bot');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Erro ao enviar recuperação:', error);
        addMessage('❌ Erro ao enviar e-mail de recuperação. Tente novamente.', 'bot');
        return;
      }

      addMessage('✅ E-mail de recuperação enviado com sucesso!', 'bot');
      addMessage('📬 Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.', 'bot');
      addMessage('Após redefinir sua senha, você pode fazer login novamente.', 'bot', [
        {
          text: '🔑 Fazer Login',
          value: 'login',
          action: () => iniciarLoginIntegrado()
        },
        {
          text: '🔄 Começar Novamente',
          value: 'reiniciar',
          action: () => reiniciarChat()
        }
      ]);

    } catch (error) {
      console.error('Erro inesperado:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  // Função para reiniciar o chat
  const reiniciarChat = () => {
    setMessages([]);
    setUserData({
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      cep: ''
    });
    userDataRef.current = {
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      cep: ''
    };
    setStep('greeting');
    setIsEditing(false);
    setEditingField(null);
    setUnidades([]);
    setSelectedUnidade(null);
    selectedUnidadeRef.current = null;
    setTipoAtendimento(null);
    setDependentesData([]);
    setDependenteAtual({
      nome: '',
      data_nascimento: '',
      parentesco: '',
      sexo: '',
      documento: ''
    });
    setDependenteSelecionado(null);
    dependentesDataRef.current = [];
    dependenteAtualRef.current = {
      nome: '',
      data_nascimento: '',
      parentesco: '',
      sexo: '',
      documento: ''
    };
    setEditingDependente(false);
    setEditingDependenteField(null);
    setVacinasDisponiveis([]);
    setAgendamentoData({
      vacina_id: 0,
      vacina_nome: '',
      preco: 0,
      data: '',
      horario: '',
      forma_pagamento_id: 0,
      forma_pagamento_nome: ''
    });
    agendamentoDataRef.current = {
      vacina_id: 0,
      vacina_nome: '',
      preco: 0,
      data: '',
      horario: '',
      forma_pagamento_id: 0,
      forma_pagamento_nome: ''
    };
    setHorariosDisponiveis([]);
    setFormasPagamento([]);
    
    // Reiniciar o chat
    setTimeout(() => {
      addMessage('👋 Olá! Sou o assistente virtual da Vaccini.', 'bot');
      addMessage('Vou te ajudar a encontrar a unidade mais próxima de você e fornecer as informações de contato.', 'bot');
      addMessage('Para começar, preciso do seu e-mail:', 'bot');
      
      // Adicionar campo de input para email
      const emailInput = createEmailInput();
      addMessageWithComponent(emailInput);
    }, 100);
  };

  // Função para criar input de email inicial
  const createEmailInput = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id="email-inicial-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value && validarEmail(value)) {
                addMessage(value, 'user');
                handleEmailSubmit(value);
              } else {
                toast.error('Por favor, digite um e-mail válido');
              }
            }
          }}
          ref={(input) => {
            if (input) {
              setTimeout(() => input.focus(), 100);
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.getElementById('email-inicial-input') as HTMLInputElement;
            const value = input.value.trim();
            if (value && validarEmail(value)) {
              addMessage(value, 'user');
              handleEmailSubmit(value);
            } else {
              toast.error('Por favor, digite um e-mail válido');
            }
          }}
          className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // Função para criar input de nome (reutilizável)
  const createNameInput = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id="nome-input"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Digite seu nome completo"
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) {
                addMessage(value, 'user');
                handleNomeSubmit(value);
              } else {
                toast.error('Por favor, digite seu nome');
              }
            }
          }}
          ref={(input) => {
            if (input) {
              setTimeout(() => input.focus(), 100);
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.getElementById('nome-input') as HTMLInputElement;
            const value = input.value.trim();
            if (value) {
              addMessage(value, 'user');
              handleNomeSubmit(value);
            } else {
              toast.error('Por favor, digite seu nome');
            }
          }}
          className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
        >
          Enviar
        </button>
      </div>
    </div>
  );

  // Funções para edição de dados
  const editarCampo = (campo: keyof UserData) => {
    setIsEditing(true);
    setEditingField(campo);
    
    const valorAtual = userDataRef.current[campo];
    addMessage(`Editando ${campo}. Valor atual: ${valorAtual}`, 'bot');
    addMessage(`Digite o novo ${campo}:`, 'bot');
    
    let inputComponent;
    
    switch (campo) {
      case 'nome':
        inputComponent = createEditInput(campo, 'text', 'Digite seu nome completo', handleNomeSubmit);
        break;
      case 'email':
        inputComponent = createEditInput(campo, 'email', 'Digite seu e-mail', handleEmailSubmit, validarEmail);
        break;
      case 'senha':
        inputComponent = createEditInput(campo, 'password', 'Digite sua senha (mínimo 6 caracteres)', handleSenhaSubmit, validarSenha);
        break;
      case 'telefone':
        inputComponent = createEditInput(campo, 'tel', 'Digite seu telefone', handleTelefoneSubmit, validarTelefone);
        break;
      case 'cep':
        inputComponent = createEditInput(campo, 'text', 'Digite seu CEP', handleCEPSubmit, validarCEP);
        break;
    }
    
    addMessageWithComponent(inputComponent);
  };

  const createEditInput = (
    campo: keyof UserData, 
    type: string, 
    placeholder: string, 
    submitHandler: (value: string) => void,
    validator?: (value: string) => boolean
  ) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id={`edit-${campo}-input`}
          type={type}
          placeholder={placeholder}
          defaultValue={userDataRef.current[campo]}
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value && (!validator || validator(value))) {
                addMessage(value, 'user');
                setIsEditing(false);
                setEditingField(null);
                submitHandler(value);
              } else {
                toast.error(`Por favor, digite um ${campo} válido`);
              }
            }
          }}
          onChange={campo === 'cep' ? (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
              value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value;
          } : undefined}
          maxLength={campo === 'cep' ? 9 : undefined}
        />
        <button
          onClick={() => {
            const input = document.getElementById(`edit-${campo}-input`) as HTMLInputElement;
            const value = input.value.trim();
            if (value && (!validator || validator(value))) {
              addMessage(value, 'user');
              setIsEditing(false);
              setEditingField(null);
              submitHandler(value);
            } else {
              toast.error(`Por favor, digite um ${campo} válido`);
            }
          }}
          className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
        >
          Atualizar
        </button>
      </div>
      <button
        onClick={() => {
          setIsEditing(false);
          setEditingField(null);
          addMessage('Edição cancelada', 'bot');
          mostrarResumo();
        }}
        className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
      >
        Cancelar Edição
      </button>
    </div>
  );

  // Função para mostrar resumo dos dados
  const mostrarResumo = () => {
    const dados = userDataRef.current;
    addMessage('📋 Resumo dos seus dados:', 'bot');
    addMessage(
      `👤 Nome: ${dados.nome}\n📧 Email: ${dados.email}\n🔒 Senha: ${'*'.repeat(dados.senha.length)}\n📞 Telefone: ${dados.telefone}\n📍 CEP: ${dados.cep}`, 
      'bot',
      [
        {
          text: '✏️ Editar Nome',
          value: 'edit-nome',
          action: () => editarCampo('nome')
        },
        {
          text: '✏️ Editar Email', 
          value: 'edit-email',
          action: () => editarCampo('email')
        },
        {
          text: '✏️ Editar Senha',
          value: 'edit-senha',
          action: () => editarCampo('senha')
        },
        {
          text: '✏️ Editar Telefone',
          value: 'edit-telefone', 
          action: () => editarCampo('telefone')
        },
        {
          text: '✏️ Editar CEP',
          value: 'edit-cep',
          action: () => editarCampo('cep')
        },
        {
          text: '✅ Confirmar e Cadastrar',
          value: 'confirm',
          action: () => confirmarDadosECadastrar()
        }
      ]
    );
  };

  const confirmarDadosECadastrar = async () => {
    setStep('cadastrando');
    addMessage('✅ Dados confirmados! Vou criar sua conta...', 'bot');
    
    // Realizar o cadastro
    const sucesso = await cadastrarUsuario(userDataRef.current);
    
    if (sucesso) {
      // Após cadastro, buscar unidades
      setTimeout(() => {
        addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
        setStep('verificando');
        handleCEPSubmit(userDataRef.current.cep);
      }, 2000);
    }
  };

  // Inicialização do chat
  useEffect(() => {
    addMessage('👋 Olá! Sou o assistente virtual da Vaccini.', 'bot');
    addMessage('Vou te ajudar a encontrar a unidade mais próxima de você e fornecer as informações de contato.', 'bot');
    addMessage('Para começar, preciso do seu e-mail:', 'bot');
    
    // Adicionar campo de input para email
    const emailInput = createEmailInput();
    addMessageWithComponent(emailInput);
  }, []);

  const handleNomeSubmit = (nome: string) => {
    console.log('=== DEBUG NOME ===');
    console.log('Nome recebido:', nome);
    
    // Atualizar ref
    userDataRef.current.nome = nome;
    console.log('userDataRef após nome:', userDataRef.current);
    
    // Atualizar state também
    setUserData(prev => {
      const updated = { ...prev, nome };
      console.log('userData state após nome:', updated);
      return updated;
    });
    
    // Se estamos editando, voltar para o resumo
    if (isEditing) {
      addMessage(`✅ Nome atualizado para: ${nome}`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    setStep('senha');
    addMessage(`Prazer em conhecê-lo, ${nome}! Agora preciso que você crie uma senha para sua conta (mínimo 6 caracteres).`, 'bot');
    
    const senhaInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
            <input
              id="senha-input"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Digite sua senha (mínimo 6 caracteres)"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
              ref={(input) => {
                if (input) {
                  setTimeout(() => input.focus(), 100);
                }
              }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarSenha(value)) {
                  addMessage('*'.repeat(value.length), 'user');
                  handleSenhaSubmit(value);
                } else {
                  toast.error('Por favor, digite uma senha com pelo menos 6 caracteres');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('senha-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarSenha(value)) {
                addMessage('*'.repeat(value.length), 'user');
                handleSenhaSubmit(value);
              } else {
                toast.error('Por favor, digite uma senha com pelo menos 6 caracteres');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(senhaInput);
  };

  const handleEmailSubmit = async (email: string) => {
    console.log('=== DEBUG EMAIL ===');
    console.log('Email recebido:', email);
    
    // Se estamos editando, apenas atualizar
    if (isEditing) {
      userDataRef.current.email = email;
      setUserData(prev => ({ ...prev, email }));
      addMessage(`✅ Email atualizado para: ${email}`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    // Verificar se email já existe na base de dados
    addMessage('🔍 Verificando se este e-mail já está cadastrado...', 'bot');
    
    try {
      // Tentar fazer uma consulta para verificar se o email existe
      const { data: userData, error } = await supabase
        .from('user')
        .select('id, nome, email')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        console.error('Erro ao verificar email:', error);
        addMessage('❌ Erro ao verificar e-mail. Tente novamente.', 'bot');
        return;
      }
      
      if (userData) {
        // Email já existe
        addMessage(`✅ Este e-mail já está cadastrado para: ${userData.nome}`, 'bot');
        addMessage('Você gostaria de fazer login ou usar outro e-mail?', 'bot', [
          {
            text: '🔑 Fazer Login',
            value: 'login',
            action: () => iniciarLoginIntegrado(email)
          },
          {
            text: '✏️ Usar Outro E-mail',
            value: 'novo-email',
            action: () => {
              addMessage('Digite um novo e-mail:', 'bot');
              const emailInput = (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      id="novo-email-input"
                      type="email"
                      placeholder="Digite outro e-mail"
                      className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && validarEmail(value)) {
                            addMessage(value, 'user');
                            handleEmailSubmit(value);
                          } else {
                            toast.error('Por favor, digite um e-mail válido');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('novo-email-input') as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && validarEmail(value)) {
                          addMessage(value, 'user');
                          handleEmailSubmit(value);
                        } else {
                          toast.error('Por favor, digite um e-mail válido');
                        }
                      }}
                      className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
                    >
                      Verificar
                    </button>
                  </div>
                </div>
              );
              addMessageWithComponent(emailInput);
            }
          }
        ]);
        return;
      }
      
      // Email não existe, pode prosseguir com cadastro
      addMessage('✅ E-mail disponível! Vamos fazer seu cadastro.', 'bot');
      
      // Atualizar dados
      userDataRef.current.email = email;
      setUserData(prev => {
        const updated = { ...prev, email };
        return updated;
      });
      
      setStep('nome');
      addMessage('Qual é o seu nome completo?', 'bot');
      
      const nomeInput = createNameInput();
      addMessageWithComponent(nomeInput);
      
    } catch (error) {
      console.error('Erro inesperado ao verificar email:', error);
      addMessage('❌ Erro inesperado. Vamos continuar com o cadastro.', 'bot');
      
      // Continuar normalmente em caso de erro
      userDataRef.current.email = email;
      setUserData(prev => ({ ...prev, email }));
      setStep('senha');
      
      const senhaInput = (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              id="senha-fallback-input"
              type="password"
              placeholder="Digite sua senha (mínimo 6 caracteres)"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && validarSenha(value)) {
                    addMessage('*'.repeat(value.length), 'user');
                    handleSenhaSubmit(value);
                  } else {
                    toast.error('Por favor, digite uma senha com pelo menos 6 caracteres');
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('senha-fallback-input') as HTMLInputElement;
                const value = input.value.trim();
                if (value && validarSenha(value)) {
                  addMessage('*'.repeat(value.length), 'user');
                  handleSenhaSubmit(value);
                } else {
                  toast.error('Por favor, digite uma senha com pelo menos 6 caracteres');
                }
              }}
              className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
            >
              Enviar
            </button>
          </div>
        </div>
      );
      addMessageWithComponent(senhaInput);
    }
  };

  const handleSenhaSubmit = (senha: string) => {
    console.log('=== DEBUG SENHA ===');
    console.log('Senha recebida (length):', senha.length);
    
    // Atualizar ref
    userDataRef.current.senha = senha;
    console.log('userDataRef após senha:', { ...userDataRef.current, senha: '*'.repeat(senha.length) });
    
    // Atualizar state também
    setUserData(prev => {
      const updated = { ...prev, senha };
      console.log('userData state após senha:', { ...updated, senha: '*'.repeat(senha.length) });
      return updated;
    });
    
    // Se estamos editando, voltar para o resumo
    if (isEditing) {
      addMessage(`✅ Senha atualizada`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    setStep('telefone');
    addMessage('Perfeito! Agora preciso do seu telefone para contato.', 'bot');
    
    const telefoneInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="telefone-input"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Digite seu telefone (ex: 11999999999)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            ref={(input) => {
              if (input) {
                setTimeout(() => input.focus(), 100);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarTelefone(value)) {
                  addMessage(value, 'user');
                  handleTelefoneSubmit(value);
                } else {
                  toast.error('Por favor, digite um telefone válido (mínimo 10 dígitos)');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('telefone-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarTelefone(value)) {
                addMessage(value, 'user');
                handleTelefoneSubmit(value);
              } else {
                toast.error('Por favor, digite um telefone válido (mínimo 10 dígitos)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(telefoneInput);
  };

  const handleTelefoneSubmit = (telefone: string) => {
    console.log('=== DEBUG TELEFONE ===');
    console.log('Telefone recebido:', telefone);
    
    // Atualizar ref
    userDataRef.current.telefone = telefone;
    console.log('userDataRef após telefone:', userDataRef.current);
    
    // Atualizar state também
    setUserData(prev => {
      const updated = { ...prev, telefone };
      console.log('userData state após telefone:', updated);
      return updated;
    });
    
    // Se estamos editando, voltar para o resumo
    if (isEditing) {
      addMessage(`✅ Telefone atualizado para: ${telefone}`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    setStep('cep');
    addMessage('Perfeito! Por último, preciso do seu CEP para encontrar as unidades que atendem sua região.', 'bot');
    
    const cepInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="cep-input"
            name="postal-code"
            type="text"
            autoComplete="postal-code"
            placeholder="Digite seu CEP (ex: 01234567)"
            maxLength={9}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            ref={(input) => {
              if (input) {
                setTimeout(() => input.focus(), 100);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarCEP(value)) {
                  addMessage(value, 'user');
                  handleCEPInput(value);
                } else {
                  toast.error('Por favor, digite um CEP válido (8 dígitos)');
                }
              }
            }}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
              }
              e.target.value = value;
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('cep-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarCEP(value)) {
                addMessage(value, 'user');
                handleCEPInput(value);
              } else {
                toast.error('Por favor, digite um CEP válido (8 dígitos)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Adicionar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(cepInput);
  };

  // Nova função para capturar CEP e mostrar resumo
  const handleCEPInput = (cep: string) => {
    // Atualizar ref
    userDataRef.current.cep = cep;
    
    // Atualizar state também
    setUserData(prev => ({ ...prev, cep }));
    
    // Se estamos editando, voltar para o resumo
    if (isEditing) {
      addMessage(`✅ CEP atualizado para: ${cep}`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    setStep('dependentes_cadastro');
    addMessage('Obrigado! Agora tenho todas as informações básicas.', 'bot');
    
    // Perguntar sobre dependentes durante o cadastro
    setTimeout(() => {
      addMessage(
        'Você tem dependentes (filhos, cônjuge, pais) que também precisam de vacinação?',
        'bot',
        [
          {
            text: '👥 Sim, quero cadastrar dependentes',
            value: 'com_dependentes',
            action: () => iniciarCadastroDependentes()
          },
          {
            text: '👤 Não, apenas para mim',
            value: 'sem_dependentes',
            action: () => finalizarCadastroSemDependentes()
          }
        ]
      );
    }, 1000);
  };

  // Função para iniciar cadastro de dependentes
  const iniciarCadastroDependentes = () => {
    addMessage('Sim, quero cadastrar dependentes', 'user');
    addMessage('Ótimo! Vou te ajudar a cadastrar seus dependentes primeiro.', 'bot');
    addMessage('Após cadastrar os dependentes, você poderá escolher para quem fazer o agendamento.', 'bot');
    
    setTimeout(() => {
      iniciarCadastroNovoDependente();
    }, 1000);
  };

  // Função para finalizar cadastro sem dependentes
  const finalizarCadastroSemDependentes = () => {
    addMessage('Não, apenas para mim', 'user');
    setTipoAtendimento('usuario');
    
    setStep('resumo');
    addMessage('Perfeito! Vou mostrar o resumo dos seus dados para confirmação.', 'bot');
    setTimeout(() => {
      mostrarResumo();
    }, 1000);
  };

  const handleTipoAtendimento = (tipo: 'usuario' | 'dependente') => {
    setTipoAtendimento(tipo);
    addMessage(tipo === 'usuario' ? 'Para mim (usuário principal)' : 'Para um dependente', 'user');
    
    if (tipo === 'usuario') {
      setStep('resumo');
      addMessage('Perfeito! Vou mostrar o resumo dos seus dados para confirmação.', 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
    } else {
      // Verificar se já há dependentes cadastrados
      if (dependentesDataRef.current.length > 0) {
        setStep('selecionar_dependente');
        addMessage('Você já possui dependentes cadastrados. Para quem é este agendamento?', 'bot');
        
        // Mostrar lista de dependentes existentes + opção de adicionar novo
        const opcoesDependentes = dependentesDataRef.current.map((dep, index) => ({
          text: `👥 ${dep.nome} (${dep.parentesco})`,
          value: `dependente-${index}`,
          action: () => selecionarDependenteExistente(dep)
        }));
        
        opcoesDependentes.push({
          text: '➕ Cadastrar Novo Dependente',
          value: 'novo-dependente',
          action: () => iniciarCadastroNovoDependente()
        });
        
        addMessage('Escolha uma opção:', 'bot', opcoesDependentes);
      } else {
        iniciarCadastroNovoDependente();
      }
    }
  };

  const selecionarDependenteExistente = (dependente: DependenteData) => {
    setDependenteSelecionado(dependente);
    addMessage(`${dependente.nome} (${dependente.parentesco})`, 'user');
    addMessage(`✅ Agendamento será feito para: ${dependente.nome}`, 'bot');
    
    // Prosseguir para buscar unidades
    setTimeout(() => {
      addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
      setStep('verificando');
      handleCEPSubmit(userDataRef.current.cep);
    }, 1000);
  };

  const iniciarCadastroNovoDependente = () => {
    setStep('dependente_nome');
    addMessage('Entendi! Agora preciso dos dados do dependente.', 'bot');
    addMessage('Qual é o nome completo do dependente?', 'bot');
    
    const nomeInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="dependente-nome-input"
            type="text"
            placeholder="Digite o nome completo do dependente"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  addMessage(value, 'user');
                  handleDependenteNome(value);
                } else {
                  toast.error('Por favor, digite o nome do dependente');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('dependente-nome-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value) {
                addMessage(value, 'user');
                handleDependenteNome(value);
              } else {
                toast.error('Por favor, digite o nome do dependente');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(nomeInput);
  };

  const handleDependenteNome = (nome: string) => {
    setDependenteAtual(prev => ({ ...prev, nome }));
    dependenteAtualRef.current.nome = nome;
    setStep('dependente_data_nascimento');
    addMessage('Qual é a data de nascimento do dependente?', 'bot');
    
    const dataInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="dependente-data-input"
            type="date"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value && validarDataNascimento(value)) {
                  addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                  handleDependenteDataNascimento(value);
                } else {
                  toast.error('Por favor, selecione uma data válida');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('dependente-data-input') as HTMLInputElement;
              const value = input.value;
              if (value && validarDataNascimento(value)) {
                addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                handleDependenteDataNascimento(value);
              } else {
                toast.error('Por favor, selecione uma data válida');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(dataInput);
  };

  const handleDependenteDataNascimento = (data: string) => {
    setDependenteAtual(prev => ({ ...prev, data_nascimento: data }));
    dependenteAtualRef.current.data_nascimento = data;
    setStep('dependente_parentesco');
    addMessage('Qual é o parentesco do dependente com você?', 'bot');
    
    addMessage(
      'Selecione o parentesco:',
      'bot',
      [
        {
          text: '👶 Filho(a)',
          value: 'filho',
          action: () => handleDependenteParentesco('Filho(a)')
        },
        {
          text: '💑 Cônjuge',
          value: 'conjuge',
          action: () => handleDependenteParentesco('Cônjuge')
        },
        {
          text: '👴 Pai/Mãe',
          value: 'pai_mae',
          action: () => handleDependenteParentesco('Pai/Mãe')
        },
        {
          text: '👥 Outro',
          value: 'outro',
          action: () => handleDependenteParentescoOutro()
        }
      ]
    );
  };

  const handleDependenteParentesco = (parentesco: string) => {
    setDependenteAtual(prev => ({ ...prev, parentesco }));
    dependenteAtualRef.current.parentesco = parentesco;
    addMessage(parentesco, 'user');
    continuarComSexo();
  };

  const handleDependenteParentescoOutro = () => {
    addMessage('Outro', 'user');
    addMessage('Digite o parentesco:', 'bot');
    
    const parentescoInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="dependente-parentesco-input"
            type="text"
            placeholder="Ex: Irmão(ã), Avô/Avó, etc."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  addMessage(value, 'user');
                  setDependenteAtual(prev => ({ ...prev, parentesco: value }));
                  dependenteAtualRef.current.parentesco = value;
                  continuarComSexo();
                } else {
                  toast.error('Por favor, digite o parentesco');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('dependente-parentesco-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value) {
                addMessage(value, 'user');
                setDependenteAtual(prev => ({ ...prev, parentesco: value }));
                dependenteAtualRef.current.parentesco = value;
                continuarComSexo();
              } else {
                toast.error('Por favor, digite o parentesco');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(parentescoInput);
  };

  const continuarComSexo = () => {
    setStep('dependente_sexo');
    addMessage('Qual é o sexo do dependente?', 'bot');
    
    addMessage(
      'Selecione o sexo:',
      'bot',
      [
        {
          text: '👨 Masculino',
          value: 'M',
          action: () => handleDependenteSexo('M')
        },
        {
          text: '👩 Feminino',
          value: 'F',
          action: () => handleDependenteSexo('F')
        }
      ]
    );
  };

  const handleDependenteSexo = (sexo: string) => {
    setDependenteAtual(prev => ({ ...prev, sexo }));
    dependenteAtualRef.current.sexo = sexo;
    addMessage(sexo === 'M' ? 'Masculino' : 'Feminino', 'user');
    
    setStep('dependente_documento');
    addMessage('Por último, preciso do CPF do dependente.', 'bot');
    
    const documentoInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="dependente-documento-input"
            type="text"
            placeholder="Digite o CPF (apenas números)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && validarDocumento(value)) {
                  addMessage(value, 'user');
                  handleDependenteDocumento(value);
                } else {
                  toast.error('Por favor, digite um CPF válido (11 dígitos)');
                }
              }
            }}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, '');
            }}
            maxLength={11}
          />
          <button
            onClick={() => {
              const input = document.getElementById('dependente-documento-input') as HTMLInputElement;
              const value = input.value.trim();
              if (value && validarDocumento(value)) {
                addMessage(value, 'user');
                handleDependenteDocumento(value);
              } else {
                toast.error('Por favor, digite um CPF válido (11 dígitos)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(documentoInput);
  };

  const handleDependenteDocumento = (documento: string) => {
    setDependenteAtual(prev => ({ ...prev, documento }));
    dependenteAtualRef.current.documento = documento;
    setStep('resumo_dependente');
    addMessage('Perfeito! Agora tenho todos os dados necessários.', 'bot');
    
    setTimeout(() => {
      mostrarResumoDependente();
    }, 1000);
  };

  const mostrarResumoDependente = () => {
    const dados = userDataRef.current;
    const dadosDep = dependenteAtualRef.current;
    
    addMessage('📋 Resumo dos dados:', 'bot');
    addMessage(
      `👤 RESPONSÁVEL:\nNome: ${dados.nome}\nEmail: ${dados.email}\nSenha: ${'*'.repeat(dados.senha.length)}\nTelefone: ${dados.telefone}\nCEP: ${dados.cep}`, 
      'bot'
    );
    
    // Mostrar dependentes já cadastrados
    if (dependentesDataRef.current.length > 0) {
      addMessage(`👥 DEPENDENTES JÁ CADASTRADOS (${dependentesDataRef.current.length}):`, 'bot');
      dependentesDataRef.current.forEach((dep, index) => {
        addMessage(
          `${index + 1}. ${dep.nome} - ${dep.parentesco} - ${dep.sexo === 'M' ? 'Masculino' : 'Feminino'}`,
          'bot'
        );
      });
    }
    
    addMessage(
      `👥 DEPENDENTE ATUAL:\nNome: ${dadosDep.nome}\nData Nascimento: ${new Date(dadosDep.data_nascimento).toLocaleDateString('pt-BR')}\nParentesco: ${dadosDep.parentesco}\nSexo: ${dadosDep.sexo === 'M' ? 'Masculino' : 'Feminino'}\nCPF: ${dadosDep.documento}`, 
      'bot',
      [
        {
          text: '✅ Salvar este Dependente',
          value: 'save-dependente',
          action: () => salvarDependenteAtual()
        },
        {
          text: '✏️ Editar Dados do Responsável',
          value: 'edit-responsavel',
          action: () => mostrarResumo()
        }
      ]
    );
  };

  const salvarDependenteAtual = () => {
    // Adicionar dependente atual à lista
    const novoDependente = { ...dependenteAtualRef.current };
    dependentesDataRef.current.push(novoDependente);
    setDependentesData(prev => [...prev, novoDependente]);
    
    addMessage('✅ Dependente salvo com sucesso!', 'bot');
    
    // Perguntar se quer adicionar mais dependentes
        setTimeout(() => {
          addMessage(
            'Gostaria de adicionar outro dependente?',
            'bot',
            [
              {
                text: '➕ Adicionar Outro Dependente',
                value: 'add-another',
                action: () => adicionarOutroDependente()
              },
              {
                text: '✅ Finalizar Cadastro de Dependentes',
                value: 'finish-dependents',
                action: () => finalizarCadastroDependentesEEscolher()
              }
            ]
          );
        }, 1000);
  };

  const adicionarOutroDependente = () => {
    // Limpar dados do dependente atual
    const dependenteLimpo = {
      nome: '',
      data_nascimento: '',
      parentesco: '',
      sexo: '',
      documento: ''
    };
    
    setDependenteAtual(dependenteLimpo);
    dependenteAtualRef.current = dependenteLimpo;
    
    addMessage('Adicionar outro dependente', 'user');
    addMessage(`📝 Vamos cadastrar o ${dependentesDataRef.current.length + 1}º dependente.`, 'bot');
    addMessage('Qual é o nome completo deste dependente?', 'bot');
    
    const nomeInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="dependente-nome-input-novo"
            type="text"
            placeholder="Digite o nome completo do dependente"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  addMessage(value, 'user');
                  handleDependenteNome(value);
                } else {
                  toast.error('Por favor, digite o nome do dependente');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('dependente-nome-input-novo') as HTMLInputElement;
              const value = input.value.trim();
              if (value) {
                addMessage(value, 'user');
                handleDependenteNome(value);
              } else {
                toast.error('Por favor, digite o nome do dependente');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(nomeInput);
  };

  // Função para finalizar cadastro de dependentes e escolher para quem agendar
  const finalizarCadastroDependentesEEscolher = async () => {
    // Primeiro, adicionar o dependente atual à lista se ainda não foi adicionado
    if (dependenteAtualRef.current.nome && 
        !dependentesDataRef.current.some(dep => dep.documento === dependenteAtualRef.current.documento)) {
      const novoDependente = { ...dependenteAtualRef.current };
      dependentesDataRef.current.push(novoDependente);
      setDependentesData(prev => [...prev, novoDependente]);
    }
    
    addMessage('✅ Finalizar Cadastro de Dependentes', 'user');
    addMessage(`Perfeito! Você cadastrou ${dependentesDataRef.current.length} dependente(s).`, 'bot');
    
    // Realizar o cadastro de todos os dependentes
    const dadosUsuario = userDataRef.current;
    const sucesso = await cadastrarMultiplosDependentes(dadosUsuario, dependentesDataRef.current);
    
    if (sucesso) {
      setTimeout(() => {
        addMessage('Agora, para quem você gostaria de fazer o agendamento?', 'bot');
        
        // Criar opções: usuário principal + todos os dependentes
        const opcoes = [
          {
            text: `👤 ${dadosUsuario.nome} (você)`,
            value: 'usuario-principal',
            action: () => {
              setTipoAtendimento('usuario');
              addMessage(`${dadosUsuario.nome} (você)`, 'user');
              prosseguirParaBuscarUnidades();
            }
          }
        ];
        
        // Adicionar opções para cada dependente
        dependentesDataRef.current.forEach((dep, index) => {
          opcoes.push({
            text: `👥 ${dep.nome} (${dep.parentesco})`,
            value: `dependente-${index}`,
            action: () => {
              setTipoAtendimento('dependente');
              setDependenteSelecionado(dep);
              addMessage(`${dep.nome} (${dep.parentesco})`, 'user');
              prosseguirParaBuscarUnidades();
            }
          });
        });
        
        addMessage('Escolha uma opção:', 'bot', opcoes);
      }, 2000);
    }
  };

  // Função para prosseguir para buscar unidades
  const prosseguirParaBuscarUnidades = () => {
    setTimeout(() => {
      addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
      setStep('verificando');
      handleCEPSubmit(userDataRef.current.cep);
    }, 1000);
  };

  const confirmarCadastroTodosDependentes = async () => {
    // Primeiro, adicionar o dependente atual à lista se ainda não foi adicionado
    if (dependenteAtualRef.current.nome && 
        !dependentesDataRef.current.some(dep => dep.documento === dependenteAtualRef.current.documento)) {
      const novoDependente = { ...dependenteAtualRef.current };
      dependentesDataRef.current.push(novoDependente);
      setDependentesData(prev => [...prev, novoDependente]);
    }
    
    // Validar dados antes do cadastro
    const dadosUsuario = userDataRef.current;
    
    console.log('=== VALIDANDO DADOS ANTES DO CADASTRO ===');
    console.log('Dados do usuário:', dadosUsuario);
    console.log('Todos os dependentes:', dependentesDataRef.current);
    
    // Validar dados do usuário
    if (!dadosUsuario.nome || !dadosUsuario.email || !dadosUsuario.senha || !dadosUsuario.telefone || !dadosUsuario.cep) {
      addMessage('❌ Erro: Dados do usuário incompletos. Por favor, reinicie o processo.', 'bot');
      return;
    }
    
    // Validar se há pelo menos um dependente
    if (dependentesDataRef.current.length === 0) {
      addMessage('❌ Erro: Nenhum dependente cadastrado. Por favor, adicione pelo menos um dependente.', 'bot');
      return;
    }
    
    // Validar dados de todos os dependentes
    for (let i = 0; i < dependentesDataRef.current.length; i++) {
      const dadosDep = dependentesDataRef.current[i];
      if (!dadosDep.nome || !dadosDep.data_nascimento || !dadosDep.parentesco || !dadosDep.sexo || !dadosDep.documento) {
        addMessage(`❌ Erro: Dados do dependente ${i + 1} (${dadosDep.nome || 'sem nome'}) incompletos.`, 'bot');
        return;
      }
      
      // Validar formato da data
      if (!validarDataNascimento(dadosDep.data_nascimento)) {
        addMessage(`❌ Erro: Data de nascimento do dependente ${dadosDep.nome} inválida.`, 'bot');
        return;
      }
    }
    
    setStep('cadastrando');
    addMessage(`✅ Dados validados! Vou criar a conta do responsável e cadastrar ${dependentesDataRef.current.length} dependente(s)...`, 'bot');
    
    // Realizar o cadastro de todos os dependentes
    const sucesso = await cadastrarMultiplosDependentes(dadosUsuario, dependentesDataRef.current);
    
    if (sucesso) {
      // Após cadastro, buscar unidades
      setTimeout(() => {
        addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
        setStep('verificando');
        handleCEPSubmit(userDataRef.current.cep);
      }, 2000);
    }
  };

  // Função para cadastrar usuário e múltiplos dependentes
  const cadastrarMultiplosDependentes = async (dadosUsuario: UserData, todosDependentes: DependenteData[]): Promise<boolean> => {
    try {
      console.log('=== CADASTRANDO USUÁRIO E MÚLTIPLOS DEPENDENTES ===');
      console.log('Dados do usuário:', dadosUsuario);
      console.log('Todos os dependentes:', todosDependentes);

      // Primeiro, criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dadosUsuario.email,
        password: dadosUsuario.senha,
        options: {
          data: {
            nome: dadosUsuario.nome,
            telefone: dadosUsuario.telefone,
            cep: dadosUsuario.cep
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar conta do responsável:', authError);
        if (authError.message.includes('already registered')) {
          // Se usuário já existe, tentar fazer login para pegar o ID
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: dadosUsuario.email,
            password: dadosUsuario.senha
          });
          
          if (loginError) {
            addMessage('❌ Este e-mail já está cadastrado com senha diferente. Tente fazer login ou use outro e-mail.', 'bot', [
              {
                text: '🔑 Fazer Login',
                value: 'login',
                action: () => iniciarLoginIntegrado()
              },
              {
                text: '✏️ Usar Outro E-mail',
                value: 'novo-email',
                action: () => editarCampo('email')
              },
              {
                text: '🔄 Começar Novamente',
                value: 'reiniciar',
                action: () => reiniciarChat()
              }
            ]);
            return false;
          }
          
          if (loginData.user) {
            // Verificar se usuário existe na tabela user, se não, inserir
            const { data: userExists } = await supabase
              .from('user')
              .select('id')
              .eq('id', loginData.user.id)
              .single();
            
            if (!userExists) {
              await supabase
                .from('user')
                .insert({
                  id: loginData.user.id,
                  nome: dadosUsuario.nome,
                  email: dadosUsuario.email,
                  celular: dadosUsuario.telefone,
                  cep: dadosUsuario.cep,
                  created_at: new Date().toISOString()
                });
            }
            
            // Cadastrar todos os dependentes
            return await inserirMultiplosDependentes(loginData.user.id, todosDependentes);
          }
        } else {
          addMessage(`❌ Erro ao criar conta do responsável: ${authError.message}`, 'bot');
        }
        return false;
      }

      if (!authData.user) {
        addMessage('❌ Erro inesperado ao criar conta do responsável. Tente novamente.', 'bot');
        return false;
      }

      // Inserir dados na tabela user (obrigatório para agendamentos)
      try {
        const { error: userError } = await supabase
          .from('user')
          .insert({
            id: authData.user.id,
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            celular: dadosUsuario.telefone,
            cep: dadosUsuario.cep,
            created_at: new Date().toISOString()
          });

        if (userError) {
          console.error('Erro ao inserir na tabela user:', userError);
          addMessage(`❌ Erro ao criar perfil do usuário: ${userError.message}`, 'bot');
          return false;
        }
      } catch (userError) {
        console.error('Erro ao inserir na tabela user:', userError);
        addMessage('❌ Erro ao criar perfil do usuário. Tente novamente.', 'bot');
        return false;
      }

      // Cadastrar todos os dependentes
      const sucessoDependentes = await inserirMultiplosDependentes(authData.user.id, todosDependentes);
      
      if (sucessoDependentes) {
        addMessage(`✅ Cadastro do responsável e ${todosDependentes.length} dependente(s) realizado com sucesso!`, 'bot');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Erro inesperado ao cadastrar múltiplos dependentes:', error);
      addMessage('❌ Erro inesperado ao realizar cadastro. Tente novamente.', 'bot');
      return false;
    }
  };

  const inserirMultiplosDependentes = async (userId: string, todosDependentes: DependenteData[]): Promise<boolean> => {
    try {
      console.log('=== INSERINDO MÚLTIPLOS DEPENDENTES ===');
      console.log('UserId:', userId);
      console.log('Dependentes a serem inseridos:', todosDependentes);
      
      let sucessos = 0;
      
      for (let i = 0; i < todosDependentes.length; i++) {
        const dependente = todosDependentes[i];
        const dadosInsercao = {
          user_id: userId,
          nome: dependente.nome,
          data_nascimento: dependente.data_nascimento,
          parentesco: dependente.parentesco,
          sexo: dependente.sexo,
          documento: dependente.documento,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`Inserindo dependente ${i + 1}:`, dadosInsercao);
        
        const { error: dependenteError } = await supabase
          .from('dependentes')
          .insert(dadosInsercao);

        if (dependenteError) {
          console.error(`Erro ao cadastrar dependente ${i + 1}:`, dependenteError);
          addMessage(`❌ Erro ao cadastrar dependente ${dependente.nome}: ${dependenteError.message}`, 'bot');
          // Continuar tentando os outros dependentes
        } else {
          console.log(`Dependente ${i + 1} cadastrado com sucesso:`, dependente.nome);
          sucessos++;
        }
      }
      
      if (sucessos === todosDependentes.length) {
        addMessage(`✅ Todos os ${sucessos} dependentes foram cadastrados com sucesso!`, 'bot');
        return true;
      } else if (sucessos > 0) {
        addMessage(`⚠️ ${sucessos} de ${todosDependentes.length} dependentes foram cadastrados. Verifique os erros acima.`, 'bot');
        return true; // Consideramos sucesso parcial como sucesso
      } else {
        addMessage('❌ Nenhum dependente foi cadastrado devido a erros.', 'bot');
        return false;
      }
      
    } catch (error) {
      console.error('Erro ao inserir múltiplos dependentes:', error);
      addMessage('❌ Erro inesperado ao cadastrar dependentes.', 'bot');
      return false;
    }
  };

  const handleCEPSubmit = async (cep: string) => {
    // Debug: verificar estado atual antes de atualizar
    console.log('=== DEBUG ANTES DE ATUALIZAR CEP ===');
    console.log('userData state atual:', userData);
    console.log('userDataRef atual:', userDataRef.current);
    console.log('CEP recebido:', cep);
    
    // Atualizar ref
    userDataRef.current.cep = cep;
    console.log('userDataRef após CEP:', userDataRef.current);
    
    // Usar dados da ref que são síncronos
    const dadosAtualizados = { ...userDataRef.current };
    
    console.log('dadosAtualizados criados:', dadosAtualizados);
    console.log('===================================');
    
    setUserData(dadosAtualizados);
    setIsLoading(true);
    setStep('verificando');
    
    try {
      // Buscar informações do CEP via ViaCEP
      const cepNumerico = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
      const cepData = await response.json();
      
      if (cepData.erro) {
        addMessage('❌ CEP não encontrado. Verifique se digitou corretamente.', 'bot');
        return;
      }
      
      addMessage(`📍 Endereço encontrado: ${cepData.logradouro}, ${cepData.bairro} - ${cepData.localidade}/${cepData.uf}`, 'bot');
      addMessage('🔍 Verificando quais unidades atendem sua região...', 'bot');
      
      // Verificar unidades que atendem o CEP
      setTimeout(async () => {
        const unidadesDisponiveis = await verificarUnidadesPorCEP(cep);
        setUnidades(unidadesDisponiveis);
        
        if (unidadesDisponiveis.length === 0) {
          addMessage('😔 Infelizmente, ainda não temos unidades cadastradas que atendem sua região específica.', 'bot');
          addMessage('Mas não se preocupe! Entre em contato conosco pelo telefone (34) 99313-0077 ou e-mail contato@vaccini.com.br que encontraremos uma solução para você.', 'bot');
          addMessage('💡 Dica: Também pode tentar com um CEP de uma região próxima para verificar outras opções disponíveis.', 'bot');
          
          // Adicionar opções de reiniciar ou finalizar
          setTimeout(() => {
            addMessage(
              'O que gostaria de fazer agora?',
              'bot',
              [
                {
                  text: '✏️ Editar CEP',
                  value: 'edit-cep',
                  action: () => editarCampo('cep')
                },
                {
                  text: '🔄 Começar Novo Cadastro',
                  value: 'reiniciar',
                  action: () => reiniciarChat()
                },
                {
                  text: '❌ Finalizar Atendimento',
                  value: 'finalizar',
                  action: () => {
                    addMessage('Muito obrigado por usar nosso atendimento virtual! Até logo! 👋', 'bot');
                  }
                }
              ]
            );
          }, 2000);
        } else {
          addMessage(`✅ Encontrei ${unidadesDisponiveis.length} unidade(s) que atende(m) sua região!`, 'bot');
          addMessage('Escolha a unidade de sua preferência:', 'bot');
          
          unidadesDisponiveis.forEach(unidade => {
            const enderecoCompleto = `${unidade.endereco}, ${unidade.numero} - ${unidade.bairro}, ${unidade.cidade}/${unidade.estado}`;
            addMessage(
              `🏥 ${unidade.nome}\n📍 ${enderecoCompleto}`,
              'bot',
              [
                {
                  text: '💉 Ver vacinas disponíveis',
                  value: unidade.id.toString(),
                  action: () => handleUnidadeSelection(unidade, dadosAtualizados)
                }
              ]
            );
          });
        }
        setStep('unidades');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      addMessage('❌ Erro ao verificar o CEP. Tente novamente.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const enviarEmailParaUnidade = async (unidade: Unidade, dadosUsuario: UserData) => {
    try {
      console.log('=== ENVIANDO EMAIL ===');
      console.log('Dados recebidos na função enviarEmail:');
      console.log('dadosUsuario:', dadosUsuario);
      console.log('unidade:', unidade);
      console.log('=====================');
      
      const functionUrl = 'https://yhvzhmzlmfkyabsmmtvg.supabase.co/functions/v1/send-email';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodnpobXpsbWZreWFic21tdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYwODU5MzAsImV4cCI6MjA0MTY2MTkzMH0.TUP8Okjax6h2aFf9I_GMvnvR6uuo-qB__z5uXPkylJM',
        },
        body: JSON.stringify({
          unidade,
          userData: dadosUsuario,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao enviar email: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Email enviado com sucesso para:', unidade.email);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  };

  const handleUnidadeSelection = async (unidade: Unidade, dadosUsuario?: UserData) => {
    setSelectedUnidade(unidade);
    selectedUnidadeRef.current = unidade;
    setStep('vacinas');
    
    console.log('=== SELEÇÃO DE UNIDADE ===');
    console.log('Unidade selecionada:', unidade);
    console.log('ID da unidade:', unidade.id);
    console.log('========================');
    
    addMessage(`🏥 Você selecionou: ${unidade.nome}`, 'bot');
    addMessage('🔍 Buscando vacinas disponíveis nesta unidade...', 'bot');
    
    // Buscar vacinas disponíveis na unidade
    const vacinas = await buscarVacinasUnidade(unidade.id);
    console.log('Vacinas retornadas pela função:', vacinas);
    setVacinasDisponiveis(vacinas);
    
    if (vacinas.length === 0) {
      addMessage('😔 Infelizmente, esta unidade não possui vacinas cadastradas no momento.', 'bot');
      addMessage('Entre em contato diretamente com a unidade para verificar disponibilidade:', 'bot');
      addMessage(`📞 Telefone: ${unidade.telefone}`, 'bot');
      
      if (unidade.email) {
        addMessage(`📧 E-mail: ${unidade.email}`, 'bot');
      }
      
      // Opções para tentar outra unidade ou finalizar
      setTimeout(() => {
        addMessage(
          'O que gostaria de fazer?',
          'bot',
          [
            {
              text: '🏥 Escolher Outra Unidade',
              value: 'outras-unidades',
              action: () => mostrarOutrasUnidades()
            },
            {
              text: '🔄 Começar Novo Cadastro',
              value: 'reiniciar',
              action: () => reiniciarChat()
            }
          ]
        );
      }, 1000);
      return;
    }
    
    addMessage(`💉 Encontrei ${vacinas.length} vacina(s) disponível(is) nesta unidade!`, 'bot');
    addMessage('Você pode buscar por uma vacina específica ou ver todas as opções:', 'bot');
    
    // Adicionar campo de busca
    const buscaVacinasComponent = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="busca-vacinas-input"
            type="text"
            placeholder="Digite o nome da vacina (ex: Covid, Gripe, Hepatite...)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                buscarVacinas(value, vacinas);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('busca-vacinas-input') as HTMLInputElement;
              const value = input.value.trim();
              buscarVacinas(value, vacinas);
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            🔍 Buscar
          </button>
        </div>
        <button
          onClick={() => mostrarTodasVacinas(vacinas)}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          📋 Ver Todas as Vacinas
        </button>
      </div>
    );
    addMessageWithComponent(buscaVacinasComponent);
  };

  // Função para buscar vacinas por nome
  const buscarVacinas = (termoBusca: string, todasVacinas: Vacina[]) => {
    if (!termoBusca) {
      addMessage('Por favor, digite o nome da vacina que está procurando.', 'bot');
      return;
    }
    
    addMessage(termoBusca, 'user');
    
    // Filtrar vacinas que contêm o termo de busca
    const vacinasEncontradas = todasVacinas.filter(vacina => 
      vacina.nome.toLowerCase().includes(termoBusca.toLowerCase())
    );
    
    if (vacinasEncontradas.length === 0) {
      addMessage(`❌ Não encontrei vacinas com "${termoBusca}" nesta unidade.`, 'bot');
      addMessage('Tente buscar por outro nome ou veja todas as vacinas disponíveis:', 'bot', [
        {
          text: '📋 Ver Todas as Vacinas',
          value: 'todas-vacinas',
          action: () => mostrarTodasVacinas(todasVacinas)
        },
        {
          text: '🔍 Fazer Nova Busca',
          value: 'nova-busca',
          action: () => {
            addMessage('Digite o nome da vacina:', 'bot');
            const novaBuscaComponent = (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    id="nova-busca-vacinas-input"
                    type="text"
                    placeholder="Digite o nome da vacina..."
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        buscarVacinas(value, todasVacinas);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('nova-busca-vacinas-input') as HTMLInputElement;
                      const value = input.value.trim();
                      buscarVacinas(value, todasVacinas);
                    }}
                    className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
                  >
                    🔍 Buscar
                  </button>
                </div>
              </div>
            );
            addMessageWithComponent(novaBuscaComponent);
          }
        }
      ]);
      return;
    }
    
    addMessage(`✅ Encontrei ${vacinasEncontradas.length} vacina(s) com "${termoBusca}":`, 'bot');
    
    // Mostrar vacinas encontradas
    vacinasEncontradas.forEach(vacina => {
      const precoTexto = vacina.tem_convenio
        ? `Preço: a partir de R$ ${vacina.valor_plano!.toFixed(2)} (convênio)`
        : `Preço: Consulte valores`;

      const dosesTexto = vacina.total_doses ? `\nDoses: ${vacina.total_doses}` : '';

      addMessage(
        `💉 ${vacina.nome}${dosesTexto}${precoTexto ? '\n💰 ' + precoTexto : ''}`,
        'bot',
        [
          {
            text: '✅ Selecionar Vacina',
            value: vacina.id.toString(),
            action: () => handleVacinaSelectionWithInsurance(vacina)
          }
        ]
      );
    });
    
    // Opção para ver todas as vacinas ou fazer nova busca
    setTimeout(() => {
      addMessage('Ou você pode:', 'bot', [
        {
          text: '📋 Ver Todas as Vacinas',
          value: 'todas-vacinas',
          action: () => mostrarTodasVacinas(todasVacinas)
        },
        {
          text: '🔍 Fazer Nova Busca',
          value: 'nova-busca',
          action: () => {
            const novaBuscaComponent = (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    id="busca-adicional-input"
                    type="text"
                    placeholder="Digite outro nome da vacina..."
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        buscarVacinas(value, todasVacinas);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('busca-adicional-input') as HTMLInputElement;
                      const value = input.value.trim();
                      buscarVacinas(value, todasVacinas);
                    }}
                    className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
                  >
                    🔍 Buscar
                  </button>
                </div>
              </div>
            );
            addMessageWithComponent(novaBuscaComponent);
          }
        }
      ]);
    }, 1000);
  };

  // Função para mostrar todas as vacinas
  const mostrarTodasVacinas = (vacinas: Vacina[]) => {
    addMessage('📋 Ver Todas as Vacinas', 'user');
    addMessage(`💉 Todas as ${vacinas.length} vacinas disponíveis nesta unidade:`, 'bot');
    
    // Mostrar todas as vacinas com informações de convênio
    vacinas.forEach(vacina => {
      const precoTexto = vacina.tem_convenio
        ? `Preço: a partir de R$ ${vacina.valor_plano!.toFixed(2)} (convênio)`
        : `Preço: Consulte valores`;

      const dosesTexto = vacina.total_doses ? `\nDoses: ${vacina.total_doses}` : '';

      addMessage(
        `💉 ${vacina.nome}${dosesTexto}${precoTexto ? '\n💰 ' + precoTexto : ''}`,
        'bot',
        [
          {
            text: '✅ Selecionar Vacina',
            value: vacina.id.toString(),
            action: () => handleVacinaSelectionWithInsurance(vacina)
          }
        ]
      );
    });
  };

  // Função para lidar com seleção de vacina incluindo lógica de convênio
  const handleVacinaSelectionWithInsurance = async (vacina: Vacina) => {
    try {
      console.log('=== SELEÇÃO DE VACINA COM CONVÊNIO ===');
      console.log('Vacina selecionada:', vacina);
      
      // Se a vacina não tem convênio, criar solicitação de agendamento
      if (!vacina.tem_convenio) {
        const nomeVacina = vacina.nome;
        addMessage(`📞 ${nomeVacina}`, 'user');
        addMessage(`📋 Solicitação de agendamento para: ${nomeVacina}`, 'bot');
        addMessage('💬 Esta vacina não possui convênio disponível no momento.', 'bot');
        addMessage('📞 Um de nossos atendentes entrará em contato com você para finalizar o agendamento e informar o valor.', 'bot');
        addMessage('📧 Você receberá um e-mail ou ligação em breve com as informações necessárias.', 'bot');
        
        // Opções para continuar
        addMessage('O que você deseja fazer?', 'bot', [
          {
            text: '✅ Confirmar solicitação',
            value: 'confirmar_solicitacao',
            action: () => handleSolicitacaoAgendamento(vacina)
          },
          {
            text: '🔍 Ver outras vacinas',
            value: 'outras_vacinas',
            action: () => {
              // Buscar vacinas novamente
              setTimeout(async () => {
                if (selectedUnidadeRef.current) {
                  const vacinas = await buscarVacinasUnidade(selectedUnidadeRef.current.id);
                  setVacinasDisponiveis(vacinas);
                  
                  if (vacinas.length > 0) {
                    addMessage('🔍 Outras vacinas disponíveis:', 'bot');
                    mostrarTodasVacinas(vacinas);
                  } else {
                    addMessage('❌ Não há outras vacinas disponíveis nesta unidade.', 'bot');
                  }
                }
              }, 500);
            }
          },
          {
            text: '❌ Cancelar',
            value: 'cancelar',
            action: () => {
              addMessage('Solicitação cancelada.', 'bot');
              addMessage('Obrigado por usar nosso atendimento virtual! 👋', 'bot');
            }
          }
        ]);
        return;
      }

      // Se tem convênio, prosseguir com agendamento automático
      const precoParaAgendamento = vacina.valor_plano || vacina.preco;
      
      // Atualizar dados do agendamento
      agendamentoDataRef.current.vacina_id = vacina.id;
      agendamentoDataRef.current.vacina_nome = vacina.nome;
      agendamentoDataRef.current.preco = precoParaAgendamento;
      
      setAgendamentoData(prev => ({
        ...prev,
        vacina_id: vacina.id,
        vacina_nome: vacina.nome,
        preco: precoParaAgendamento
      }));
      
      addMessage(`✅ ${vacina.nome} - a partir de R$ ${precoParaAgendamento.toFixed(2)} (convênio)`, 'user');
      
      setStep('data');
      addMessage('📅 Agora vou verificar os dias disponíveis nesta unidade...', 'bot');
      
      // Buscar dias disponíveis da unidade primeiro
      await mostrarCalendarioComDiasDisponiveis();
      
    } catch (error) {
      console.error('Erro ao processar seleção de vacina:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  // Função para mostrar calendário com dias disponíveis da unidade
  const mostrarCalendarioComDiasDisponiveis = async () => {
    try {
      if (!selectedUnidadeRef.current) {
        addMessage('❌ Erro: Unidade não selecionada.', 'bot');
        return;
      }

      // Buscar dias da semana que a unidade atende
      const { data: diasDisponiveis, error } = await supabase
        .from('unit_schedules')
        .select('dia_da_semana, qtd_agendamentos')
        .eq('unit_id', selectedUnidadeRef.current.id);

      if (error) {
        console.error('Erro ao buscar dias disponíveis:', error);
        addMessage('❌ Erro ao buscar dias disponíveis da unidade.', 'bot');
        return;
      }

      if (!diasDisponiveis || diasDisponiveis.length === 0) {
        addMessage('❌ Esta unidade não possui horários configurados.', 'bot');
        addMessage('📞 Entre em contato diretamente com a unidade:', 'bot');
        addMessage(`📞 Telefone: ${selectedUnidadeRef.current.telefone}`, 'bot');
        return;
      }

      // Extrair dias únicos
      const diasUnicos = [...new Set(diasDisponiveis.map(d => d.dia_da_semana))];
      console.log('Dias que a unidade atende:', diasUnicos);

      addMessage(`📅 Esta unidade atende nos seguintes dias: ${diasUnicos.join(', ')}`, 'bot');
      addMessage('Escolha uma data disponível:', 'bot');

      // Gerar próximas datas disponíveis (próximas 2 semanas)
      const datasDisponiveis: { data: string; diaSemana: string; dataFormatada: string }[] = [];
      const hoje = new Date();
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      for (let i = 0; i < 14; i++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);
        const diaDaSemana = diasSemana[data.getDay()];


        if (diasUnicos.includes(diaDaSemana)) {
          datasDisponiveis.push({
            data: data.toISOString().split('T')[0],
            diaSemana: diaDaSemana,
            dataFormatada: data.toLocaleDateString('pt-BR')
          });
        }
      }

      console.log('Datas disponíveis geradas:', datasDisponiveis);

      if (datasDisponiveis.length === 0) {
        addMessage('❌ Não há datas disponíveis nas próximas 2 semanas.', 'bot');
        addMessage('📞 Entre em contato diretamente com a unidade para agendar.', 'bot');
        return;
      }

      // Criar seletor visual de datas
      const datasComponent = (
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Próximas Datas Disponíveis:</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {datasDisponiveis.slice(0, 10).map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    addMessage(`${item.dataFormatada} (${item.diaSemana})`, 'user');
                    handleDataSelection(item.data);
                  }}
                  className="p-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors text-sm font-medium text-left"
                >
                  <div>{item.dataFormatada}</div>
                  <div className="text-xs opacity-90">{item.diaSemana}</div>
                </button>
              ))}
            </div>
            {datasDisponiveis.length > 10 && (
              <div className="mt-2 text-sm text-gray-600 text-center">
                Mostrando primeiras 10 datas. Use o campo abaixo para outras datas.
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ou escolha uma data específica:
              </label>
              <input
                id="data-agendamento-especifica"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-[#009688]"
                onChange={(e) => {
                  const dataSelecionada = e.target.value;
                  if (!dataSelecionada) return;

                  const [ano, mes, dia] = dataSelecionada.split('-').map(Number);
                  const dataObj = new Date(ano, mes - 1, dia); // Criar data no fuso horário local
                  const diaDaSemana = diasSemana[dataObj.getDay()];

                  if (!diasUnicos.includes(diaDaSemana)) {
                    toast.error(`Esta unidade não atende às ${diaDaSemana.toLowerCase()}s`);
                    e.target.value = '';
                    return;
                  }

                  addMessage(dataObj.toLocaleDateString('pt-BR'), 'user');
                  handleDataSelection(dataSelecionada);
                }}
              />
            </div>
          </div>
        </div>
      );

      addMessageWithComponent(datasComponent);

    } catch (error) {
      console.error('Erro ao buscar dias disponíveis:', error);
      addMessage('❌ Erro inesperado ao buscar dias disponíveis.', 'bot');
    }
  };

  // Função para criar solicitação de agendamento
  const handleSolicitacaoAgendamento = async (vacina: Vacina) => {
    try {
      addMessage('✅ Confirmar solicitação', 'user');
      addMessage('📝 Criando sua solicitação de agendamento...', 'bot');

      // Verificar se há usuário logado ou usar dados do cadastro
      let userId: string | null = null;
      
      // Primeiro tentar pegar usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
      } else {
        // Se não está logado, tentar fazer login temporário com os dados do chat
        if (userDataRef.current.email && userDataRef.current.senha) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userDataRef.current.email,
            password: userDataRef.current.senha
          });
          
          if (!loginError && loginData.user) {
            userId = loginData.user.id;
          }
        }
      }
      
      if (!userId) {
        addMessage('❌ Erro ao identificar usuário. Tente fazer login novamente.', 'bot');
        return;
      }

      // Salvar solicitação na tabela
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .insert({
          user_id: userId,
          vacina_id: vacina.id,
          unidade_id: selectedUnidadeRef.current?.id || null,
          observacoes: `Solicitação via chat público - Vacina: ${vacina.nome}${dependenteSelecionado ? ` - Dependente: ${dependenteSelecionado.nome} (${dependenteSelecionado.parentesco})` : ''}`,
          status: 'pendente',
          prioridade: 'normal'
        });

      if (error) {
        console.error('Erro ao salvar solicitação:', error);
        addMessage('❌ Erro ao registrar sua solicitação. Tente novamente.', 'bot');
        return;
      }

      addMessage('✅ Solicitação registrada com sucesso!', 'bot');
      addMessage('📋 Número da solicitação: #' + new Date().getTime(), 'bot');
      addMessage('📞 Nossa equipe entrará em contato em breve.', 'bot');
      addMessage('📧 Você receberá um e-mail ou ligação nas próximas 24 horas.', 'bot');
      addMessage('Obrigado por escolher a Vaccini! 😊', 'bot');
      
      // Opção de fazer nova solicitação
      setTimeout(() => {
        addMessage('Gostaria de fazer outra solicitação?', 'bot', [
          {
            text: '🔄 Nova solicitação',
            value: 'nova_solicitacao',
            action: () => {
              // Reiniciar processo para nova solicitação
              setTimeout(() => {
                reiniciarChat();
              }, 1000);
            }
          },
          {
            text: '❌ Finalizar',
            value: 'finalizar',
            action: () => {
              addMessage('Muito obrigado! Até logo! 👋', 'bot');
            }
          }
        ]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  const mostrarOutrasUnidades = () => {
    if (unidades.length > 1) {
      addMessage('🏥 Outras unidades disponíveis:', 'bot');
      
      unidades.filter(u => u.id !== selectedUnidade?.id).forEach(unidade => {
        const enderecoCompleto = `${unidade.endereco}, ${unidade.numero} - ${unidade.bairro}, ${unidade.cidade}/${unidade.estado}`;
        addMessage(
          `🏥 ${unidade.nome}\n📍 ${enderecoCompleto}`,
          'bot',
          [
            {
              text: '💉 Ver vacinas desta unidade',
              value: unidade.id.toString(),
              action: () => handleUnidadeSelection(unidade, userData)
            }
          ]
        );
      });
    } else {
      addMessage('😔 Não há outras unidades disponíveis para sua região.', 'bot');
    }
  };

  const handleVacinaSelection = (vacina: Vacina) => {
    console.log('=== SELEÇÃO DE VACINA ===');
    console.log('Vacina selecionada:', vacina);
    
    // Atualizar ref
    agendamentoDataRef.current.vacina_id = vacina.id;
    agendamentoDataRef.current.vacina_nome = vacina.nome;
    agendamentoDataRef.current.preco = vacina.preco;
    
    setAgendamentoData(prev => {
      const novoAgendamento = {
        ...prev,
        vacina_id: vacina.id,
        vacina_nome: vacina.nome,
        preco: vacina.preco
      };
      console.log('agendamentoData atualizado:', novoAgendamento);
      return novoAgendamento;
    });
    
    addMessage(`💉 ${vacina.nome} - R$ ${vacina.preco.toFixed(2).replace('.', ',')}`, 'user');
    setStep('data');
    
    addMessage('📅 Agora escolha a data para seu agendamento:', 'bot');
    addMessage('⚠️ Selecione uma data a partir de hoje:', 'bot');
    
    // Date picker para seleção da data
    const dataInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="data-agendamento-input"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value && new Date(value) >= new Date()) {
                  addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                  handleDataSelection(value);
                } else {
                  toast.error('Por favor, selecione uma data válida (a partir de hoje)');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('data-agendamento-input') as HTMLInputElement;
              const value = input.value;
              if (value && new Date(value) >= new Date()) {
                addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                handleDataSelection(value);
              } else {
                toast.error('Por favor, selecione uma data válida (a partir de hoje)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(dataInput);
  };

  const handleDataSelection = async (data: string) => {
    console.log('=== SELEÇÃO DE DATA ===');
    console.log('Data selecionada:', data);
    
    if (!selectedUnidadeRef.current) {
      addMessage('❌ Erro: Unidade não selecionada. Tente novamente.', 'bot');
      return;
    }
    
    // Atualizar ref
    agendamentoDataRef.current.data = data;
    
    setAgendamentoData(prev => {
      const novoAgendamento = { ...prev, data };
      console.log('agendamentoData após data:', novoAgendamento);
      return novoAgendamento;
    });
    
    // Determinar dia da semana (corrigindo problema de fuso horário)
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia); // Criar data no fuso horário local
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[dataObj.getDay()];
    
    setStep('horario');
    addMessage(`📅 Data selecionada: ${dataObj.toLocaleDateString('pt-BR')} (${diaSemana})`, 'bot');
    addMessage('🕒 Buscando horários disponíveis para esta data...', 'bot');
    
    try {
      // Buscar horários da unidade para o dia da semana selecionado
      const { data: horariosUnidade, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', selectedUnidadeRef.current.id)
        .eq('dia_da_semana', diaSemana);
      
      console.log('Horários da unidade:', horariosUnidade);
      
      if (error) {
        console.error('Erro ao buscar horários:', error);
        addMessage('❌ Erro ao buscar horários disponíveis. Tente novamente.', 'bot');
        return;
      }
      
      if (!horariosUnidade || horariosUnidade.length === 0) {
        addMessage(`❌ Esta unidade não atende às ${diaSemana.toLowerCase()}s ou não há horários disponíveis.`, 'bot');
        addMessage('Por favor, escolha outra data:', 'bot');
        
        // Mostrar seletor de data novamente
        const novaDataInput = (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                id="nova-data-agendamento-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
                ref={(input) => {
                  if (input) {
                    setTimeout(() => input.focus(), 100);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('nova-data-agendamento-input') as HTMLInputElement;
                  const value = input.value;
                  if (value && new Date(value) >= new Date()) {
                    addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                    handleDataSelection(value);
                  } else {
                    toast.error('Por favor, selecione uma data válida (a partir de hoje)');
                  }
                }}
                className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        );
        addMessageWithComponent(novaDataInput);
        return;
      }
      
      addMessage(`✅ Encontrei ${horariosUnidade.length} horário(s) disponível(is) para ${diaSemana.toLowerCase()}:`, 'bot');
      
      // Criar seletor de horários baseado nos dados reais da unidade
      const horariosComponent = (
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Horários Disponíveis:</h4>
            <div className="grid grid-cols-2 gap-2">
              {horariosUnidade.map((horario, index) => {
                const inicio = horario.horario_inicio.substring(0, 5); // Remove segundos
                const fim = horario.horario_fim.substring(0, 5);
                const vagas = horario.qtd_agendamentos;
                
                // Se qtd_agendamentos é NULL ou undefined, mostrar "Disponível"
                const vagasTexto = vagas !== null && vagas !== undefined 
                  ? `${vagas} vagas` 
                  : 'Disponível';
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      const horarioSelecionado = inicio;
                      addMessage(`${inicio} às ${fim}`, 'user');
                      handleHorarioSelection(horarioSelecionado);
                    }}
                    className="p-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors text-sm font-medium"
                  >
                    {inicio} às {fim}
                    <br />
                    <span className="text-xs opacity-90">{vagasTexto}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
      
      addMessageWithComponent(horariosComponent);
      
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      addMessage('❌ Erro inesperado ao buscar horários. Tente novamente.', 'bot');
    }
  };

  const handleHorarioSelection = async (horario: string) => {
    console.log('=== SELEÇÃO DE HORÁRIO ===');
    console.log('Horário selecionado:', horario);
    
    // Atualizar ref
    agendamentoDataRef.current.horario = horario;
    
    setAgendamentoData(prev => {
      const novoAgendamento = { ...prev, horario };
      console.log('agendamentoData após horário:', novoAgendamento);
      return novoAgendamento;
    });
    
    setStep('pagamento');
    addMessage('💳 Agora escolha a forma de pagamento:', 'bot');
    
    // Buscar a vacina selecionada para mostrar preços corretos
    console.log('=== DEBUG BUSCA VACINA PAGAMENTO ===');
    console.log('agendamentoDataRef.current.vacina_id:', agendamentoDataRef.current.vacina_id);
    console.log('vacinasDisponiveis:', vacinasDisponiveis);
    console.log('vacinasDisponiveis IDs:', vacinasDisponiveis.map(v => v.id));
    
    const vacinaSelecionada = vacinasDisponiveis.find(v => v.id === agendamentoDataRef.current.vacina_id);
    console.log('vacinaSelecionada encontrada:', vacinaSelecionada);
    
    if (!vacinaSelecionada) {
      console.error('ERRO: Vacina não encontrada no array vacinasDisponiveis');
      console.error('Tentando buscar ID:', agendamentoDataRef.current.vacina_id);
      console.error('IDs disponíveis:', vacinasDisponiveis.map(v => v.id));
      
      // Tentar recarregar as vacinas da unidade se o array estiver vazio
      if (vacinasDisponiveis.length === 0 && selectedUnidadeRef.current) {
        console.log('Recarregando vacinas da unidade...');
        try {
          const vacinas = await buscarVacinasUnidade(selectedUnidadeRef.current.id);
          setVacinasDisponiveis(vacinas);
          console.log('Vacinas recarregadas:', vacinas);
          
          // Tentar encontrar a vacina novamente após recarregar
          const vacinaEncontrada = vacinas.find(v => v.id === agendamentoDataRef.current.vacina_id);
          if (vacinaEncontrada) {
            console.log('Vacina encontrada após recarregar:', vacinaEncontrada);
            // Continuar com a vacina encontrada
            const vacinaSelecionadaCorrigida = vacinaEncontrada;
            
            // Mostrar informações da vacina com preços diferenciados
            const precoConvenio = vacinaSelecionadaCorrigida.valor_plano || 0;
            const precoOriginal = vacinaSelecionadaCorrigida.preco || 0;
            
            addMessage(`💉 Vacina selecionada: ${vacinaSelecionadaCorrigida.nome}`, 'bot');
            
            // Criar opções de pagamento com preços específicos
            const pagamentoOptions = [
              {
                text: `💚 Convênio - R$ ${precoConvenio.toFixed(2)}`,
                value: 'convenio',
                action: () => handlePagamentoConvenio(vacinaSelecionadaCorrigida)
              },
              {
                text: `💳 Pix - Valor a combinar`,
                value: 'pix',
                action: () => handlePagamentoOutraForma('Pix', precoOriginal, vacinaSelecionadaCorrigida)
              },
              {
                text: `💳 Cartão de Crédito - Valor a combinar`,
                value: 'credito',
                action: () => handlePagamentoOutraForma('Cartão de Crédito', precoOriginal, vacinaSelecionadaCorrigida)
              },
              {
                text: `💳 Cartão de Débito - Valor a combinar`,
                value: 'debito',
                action: () => handlePagamentoOutraForma('Cartão de Débito', precoOriginal, vacinaSelecionadaCorrigida)
              },
              {
                text: `💰 Dinheiro - Valor a combinar`,
                value: 'dinheiro',
                action: () => handlePagamentoOutraForma('Dinheiro', precoOriginal, vacinaSelecionadaCorrigida)
              }
            ];
            
            addMessage('Escolha a forma de pagamento:', 'bot', pagamentoOptions);
            return;
          }
        } catch (error) {
          console.error('Erro ao recarregar vacinas:', error);
        }
      }
      
      // Tentar encontrar por nome como fallback
      const vacinaPorNome = vacinasDisponiveis.find(v => v.nome === agendamentoDataRef.current.vacina_nome);
      if (vacinaPorNome) {
        console.log('Vacina encontrada por nome:', vacinaPorNome);
        // Atualizar o ID para o correto
        agendamentoDataRef.current.vacina_id = vacinaPorNome.id;
        setAgendamentoData(prev => ({ ...prev, vacina_id: vacinaPorNome.id }));
        // Continuar com a vacina encontrada por nome
        const vacinaSelecionadaCorrigida = vacinaPorNome;
        
        // Mostrar informações da vacina com preços diferenciados
        const precoConvenio = vacinaSelecionadaCorrigida.valor_plano || 0;
        const precoOriginal = vacinaSelecionadaCorrigida.preco || 0;
        
        addMessage(`💉 Vacina selecionada: ${vacinaSelecionadaCorrigida.nome}`, 'bot');
        
        // Criar opções de pagamento com preços específicos
        const pagamentoOptions = [
          {
            text: `💚 Convênio - R$ ${precoConvenio.toFixed(2)}`,
            value: 'convenio',
            action: () => handlePagamentoConvenio(vacinaSelecionadaCorrigida)
          },
          {
            text: `💳 Pix - Valor a combinar`,
            value: 'pix',
            action: () => handlePagamentoOutraForma('Pix', precoOriginal, vacinaSelecionadaCorrigida)
          },
          {
            text: `💳 Cartão de Crédito - Valor a combinar`,
            value: 'credito',
            action: () => handlePagamentoOutraForma('Cartão de Crédito', precoOriginal, vacinaSelecionadaCorrigida)
          },
          {
            text: `💳 Cartão de Débito - Valor a combinar`,
            value: 'debito',
            action: () => handlePagamentoOutraForma('Cartão de Débito', precoOriginal, vacinaSelecionadaCorrigida)
          },
          {
            text: `💰 Dinheiro - Valor a combinar`,
            value: 'dinheiro',
            action: () => handlePagamentoOutraForma('Dinheiro', precoOriginal, vacinaSelecionadaCorrigida)
          }
        ];

        addMessage(
          'Escolha sua forma de pagamento:',
          'bot',
          pagamentoOptions
        );
        return;
      }
      
      addMessage('❌ Erro: Não foi possível recuperar os dados da vacina selecionada.', 'bot');
      addMessage('🔄 Vamos tentar reiniciar o processo de seleção.', 'bot');
      
      // Oferecer opção de reiniciar o processo
      addMessage('O que você deseja fazer?', 'bot', [
        {
          text: '🔄 Selecionar vacina novamente',
          value: 'reselecionar_vacina',
          action: async () => {
            if (selectedUnidadeRef.current) {
              const vacinas = await buscarVacinasUnidade(selectedUnidadeRef.current.id);
              setVacinasDisponiveis(vacinas);
              
              if (vacinas.length > 0) {
                addMessage('🔍 Vacinas disponíveis:', 'bot');
                mostrarTodasVacinas(vacinas);
              } else {
                addMessage('❌ Não há vacinas disponíveis nesta unidade.', 'bot');
              }
            }
          }
        },
        {
          text: '🔄 Começar novamente',
          value: 'reiniciar',
          action: () => reiniciarChat()
        }
      ]);
      return;
    }
    
    // Mostrar informações da vacina com preços diferenciados
    const precoConvenio = vacinaSelecionada.valor_plano || 0;
    const precoOriginal = vacinaSelecionada.preco || 0;
    
    addMessage(`💉 Vacina selecionada: ${vacinaSelecionada.nome}`, 'bot');
    
    // Criar opções de pagamento com preços específicos
    const pagamentoOptions = [
      {
        text: `💚 Convênio - R$ ${precoConvenio.toFixed(2)}`,
        value: 'convenio',
        action: () => handlePagamentoConvenio(vacinaSelecionada)
      },
      {
        text: `💳 Pix - Valor a combinar`,
        value: 'pix',
        action: () => handlePagamentoOutraForma('Pix', precoOriginal, vacinaSelecionada)
      },
      {
        text: `💳 Cartão de Crédito - Valor a combinar`,
        value: 'credito',
        action: () => handlePagamentoOutraForma('Cartão de Crédito', precoOriginal, vacinaSelecionada)
      },
      {
        text: `💳 Cartão de Débito - Valor a combinar`,
        value: 'debito',
        action: () => handlePagamentoOutraForma('Cartão de Débito', precoOriginal, vacinaSelecionada)
      },
      {
        text: `💰 Dinheiro - Valor a combinar`,
        value: 'dinheiro',
        action: () => handlePagamentoOutraForma('Dinheiro', precoOriginal, vacinaSelecionada)
      }
    ];
    
    addMessage(
      'Escolha a forma de pagamento:',
      'bot',
      pagamentoOptions
    );
  };

  // Função para pagamento via convênio (agendamento automático)
  const handlePagamentoConvenio = (vacina: Vacina) => {
    const precoConvenio = vacina.valor_plano || 0;
    addMessage(`💚 Convênio - R$ ${precoConvenio.toFixed(2)}`, 'user');
    
    // Atualizar dados do agendamento
    agendamentoDataRef.current.preco = precoConvenio;
    agendamentoDataRef.current.forma_pagamento_id = 4; // ID 4 para Convênio
    agendamentoDataRef.current.forma_pagamento_nome = 'Convênio';
    
    setAgendamentoData(prev => ({
      ...prev,
      preco: precoConvenio,
      forma_pagamento_id: 4,
      forma_pagamento_nome: 'Convênio'
    }));
    
    setStep('confirmacao');
    addMessage('✅ Pagamento via convênio selecionado!', 'bot');
    addMessage('📋 Agendamento será feito automaticamente.', 'bot');
    
    setTimeout(() => {
      mostrarResumoAgendamento();
    }, 1000);
  };

  // Função para outras formas de pagamento (solicitação de agendamento)
  const handlePagamentoOutraForma = (formaPagamento: string, preco: number, vacina: Vacina) => {
    addMessage(`💳 ${formaPagamento} - Valor a consultar`, 'user');
    
    addMessage(`💳 Forma de pagamento selecionada: ${formaPagamento}`, 'bot');
    addMessage('💰 O valor será informado pela nossa equipe durante o contato.', 'bot');
    addMessage('📞 Como esta forma de pagamento requer confirmação presencial, vou criar uma solicitação de agendamento.', 'bot');
    addMessage('📧 Nossa equipe entrará em contato para confirmar o agendamento e informar o valor final.', 'bot');
    
    setTimeout(() => {
      addMessage('Confirma a solicitação de agendamento?', 'bot', [
        {
          text: '✅ Confirmar Solicitação',
          value: 'confirmar',
          action: () => criarSolicitacaoAgendamentoCompleta(vacina, formaPagamento, preco)
        },
        {
          text: '🔄 Escolher Outra Forma de Pagamento',
          value: 'outra-forma',
          action: () => {
            // Voltar para seleção de pagamento
            setTimeout(() => {
              handleHorarioSelection(agendamentoDataRef.current.horario);
            }, 500);
          }
        },
        {
          text: '❌ Cancelar',
          value: 'cancelar',
          action: () => {
            addMessage('Agendamento cancelado.', 'bot');
            addMessage('Obrigado por usar nosso atendimento virtual! 👋', 'bot');
          }
        }
      ]);
    }, 1000);
  };

  // Função para criar solicitação de agendamento completa
  const criarSolicitacaoAgendamentoCompleta = async (vacina: Vacina, formaPagamento: string, preco: number) => {
    try {
      addMessage('✅ Confirmar Solicitação', 'user');
      addMessage('📝 Criando sua solicitação de agendamento...', 'bot');

      // Verificar usuário
      let userId: string | null = null;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
      } else if (userDataRef.current.email && userDataRef.current.senha) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: userDataRef.current.email,
          password: userDataRef.current.senha
        });
        
        if (!loginError && loginData.user) {
          userId = loginData.user.id;
        }
      }
      
      if (!userId) {
        addMessage('❌ Erro ao identificar usuário. Tente fazer login novamente.', 'bot');
        return;
      }

      // Criar observações detalhadas
      const observacoes = `Solicitação via chat público
Vacina: ${vacina.nome}
Data: ${new Date(agendamentoDataRef.current.data).toLocaleDateString('pt-BR')}
Horário: ${agendamentoDataRef.current.horario}
Forma de Pagamento: ${formaPagamento}
Valor: A consultar (será informado durante o contato)
Unidade: ${selectedUnidadeRef.current?.nome}${dependenteSelecionado ? `
Dependente: ${dependenteSelecionado.nome} (${dependenteSelecionado.parentesco})` : ''}`;

      // Salvar solicitação na tabela
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .insert({
          user_id: userId,
          vacina_id: vacina.id,
          unidade_id: selectedUnidadeRef.current?.id || null,
          observacoes: observacoes,
          status: 'pendente',
          prioridade: 'normal'
        });

      if (error) {
        console.error('Erro ao salvar solicitação:', error);
        addMessage('❌ Erro ao registrar sua solicitação. Tente novamente.', 'bot');
        return;
      }

      addMessage('✅ Solicitação de agendamento criada com sucesso!', 'bot');
      addMessage('📋 Detalhes da solicitação:', 'bot');
      addMessage(`📅 Data: ${new Date(agendamentoDataRef.current.data).toLocaleDateString('pt-BR')}
🕒 Horário: ${agendamentoDataRef.current.horario}
💉 Vacina: ${vacina.nome}
💳 Pagamento: ${formaPagamento}
💰 Valor: A consultar
🏥 Unidade: ${selectedUnidadeRef.current?.nome}`, 'bot');
      
      addMessage('📞 Nossa equipe entrará em contato em breve para confirmar todos os detalhes.', 'bot');
      addMessage('📧 Você receberá um e-mail ou ligação nas próximas 24 horas.', 'bot');
      addMessage('Obrigado por escolher a Vaccini! 😊', 'bot');
      
      // Opção de fazer nova solicitação
      setTimeout(() => {
        addMessage('Gostaria de fazer outra solicitação?', 'bot', [
          {
            text: '🔄 Nova solicitação',
            value: 'nova_solicitacao',
            action: () => {
              setTimeout(() => {
                reiniciarChat();
              }, 1000);
            }
          },
          {
            text: '❌ Finalizar',
            value: 'finalizar',
            action: () => {
              addMessage('Muito obrigado! Até logo! 👋', 'bot');
            }
          }
        ]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  const handlePagamentoSelection = (formaPagamento: {id: number, nome: string}) => {
    console.log('=== SELEÇÃO DE PAGAMENTO ===');
    console.log('Forma de pagamento selecionada:', formaPagamento);
    
    // Atualizar ref
    agendamentoDataRef.current.forma_pagamento_id = formaPagamento.id;
    agendamentoDataRef.current.forma_pagamento_nome = formaPagamento.nome.trim();
    
    setAgendamentoData(prev => {
      const novoAgendamento = {
        ...prev,
        forma_pagamento_id: formaPagamento.id,
        forma_pagamento_nome: formaPagamento.nome.trim()
      };
      console.log('agendamentoData após pagamento:', novoAgendamento);
      return novoAgendamento;
    });
    
    addMessage(formaPagamento.nome.trim(), 'user');
    setStep('confirmacao');
    
    // Mostrar resumo do agendamento com delay para garantir atualização
    setTimeout(() => {
      mostrarResumoAgendamento();
    }, 100);
  };

  const mostrarResumoAgendamento = () => {
    console.log('=== RESUMO DO AGENDAMENTO ===');
    console.log('selectedUnidade:', selectedUnidade);
    console.log('agendamentoData state:', agendamentoData);
    console.log('agendamentoDataRef:', agendamentoDataRef.current);
    console.log('dependenteSelecionado:', dependenteSelecionado);
    console.log('tipoAtendimento:', tipoAtendimento);
    console.log('============================');
    
    // Usar dados da ref que são síncronos
    const agendamento = agendamentoDataRef.current;
    const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
    
    // Determinar para quem é o agendamento
    let pacienteInfo = '';
    if (tipoAtendimento === 'dependente' && dependenteSelecionado) {
      pacienteInfo = `👥 Paciente: ${dependenteSelecionado.nome} (${dependenteSelecionado.parentesco})\n`;
    } else if (tipoAtendimento === 'usuario') {
      pacienteInfo = `👤 Paciente: ${userDataRef.current.nome} (você)\n`;
    }
    
    addMessage('📋 Resumo do seu agendamento:', 'bot');
    addMessage(
      `${pacienteInfo}🏥 Unidade: ${selectedUnidadeRef.current?.nome}\n💉 Vacina: ${agendamento.vacina_nome}\n📅 Data: ${dataFormatada}\n🕒 Horário: ${agendamento.horario}\n💳 Pagamento: ${agendamento.forma_pagamento_nome}\n💰 Valor: R$ ${agendamento.preco.toFixed(2).replace('.', ',')}`,
      'bot',
      [
        {
          text: '✅ Confirmar Agendamento',
          value: 'confirmar',
          action: () => confirmarAgendamento()
        },
        {
          text: '✏️ Alterar Vacina',
          value: 'alterar-vacina',
          action: () => mostrarVacinasNovamente()
        },
        {
          text: '📅 Alterar Data',
          value: 'alterar-data',
          action: () => mostrarDataNovamente()
        },
        {
          text: '💳 Alterar Pagamento',
          value: 'alterar-pagamento',
          action: () => mostrarPagamentoNovamente()
        }
      ]
    );
  };

  const mostrarVacinasNovamente = () => {
    setStep('vacinas');
    addMessage('💉 Escolha outra vacina:', 'bot');
    
    vacinasDisponiveis.forEach(vacina => {
      addMessage(
        `💉 ${vacina.nome}\n💰 Preço: R$ ${vacina.preco.toFixed(2).replace('.', ',')}`,
        'bot',
        [
          {
            text: '✅ Selecionar Vacina',
            value: vacina.id.toString(),
            action: () => handleVacinaSelectionWithInsurance(vacina)
          }
        ]
      );
    });
  };

  const mostrarDataNovamente = () => {
    setStep('data');
    addMessage('📅 Escolha uma nova data:', 'bot');
    
    const dataInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="nova-data-input"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                if (value && new Date(value) >= new Date()) {
                  addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                  handleDataSelection(value);
                } else {
                  toast.error('Por favor, selecione uma data válida (a partir de hoje)');
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('nova-data-input') as HTMLInputElement;
              const value = input.value;
              if (value && new Date(value) >= new Date()) {
                addMessage(new Date(value).toLocaleDateString('pt-BR'), 'user');
                handleDataSelection(value);
              } else {
                toast.error('Por favor, selecione uma data válida (a partir de hoje)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(dataInput);
  };

  const mostrarPagamentoNovamente = () => {
    setStep('pagamento');
    addMessage('💳 Escolha outra forma de pagamento:', 'bot');
    
    const pagamentoOptions = formasPagamento.map(forma => ({
      text: `💳 ${forma.nome.trim()}`,
      value: forma.id.toString(),
      action: () => handlePagamentoSelection(forma)
    }));
    
    addMessage(
      'Formas de pagamento disponíveis:',
      'bot',
      pagamentoOptions
    );
  };

  const confirmarAgendamento = async () => {
    setStep('salvando');
    addMessage('✅ Confirmando seu agendamento...', 'bot');
    
    // Verificar se temos todos os dados necessários
    if (!selectedUnidadeRef.current) {
      addMessage('❌ Erro: Unidade não selecionada. Por favor, reinicie o processo.', 'bot');
      return;
    }
    
    if (!agendamentoDataRef.current.vacina_id || !agendamentoDataRef.current.data || !agendamentoDataRef.current.horario) {
      addMessage('❌ Erro: Dados do agendamento incompletos. Por favor, reinicie o processo.', 'bot');
      return;
    }
    
    // Buscar o usuário cadastrado para pegar o ID
    try {
      // Fazer login temporário para obter o user ID
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: userDataRef.current.email,
        password: userDataRef.current.senha
      });
      
      if (loginError || !loginData.user) {
        addMessage('❌ Erro ao confirmar seus dados. Tente novamente.', 'bot');
        return;
      }
      
      const userId = loginData.user.id;
      const unidadeId = selectedUnidadeRef.current.id;
      
      // Salvar agendamento usando dados da ref
      const sucesso = await salvarAgendamento(agendamentoDataRef.current, userId, unidadeId);
      
      if (sucesso) {
        // Determinar informações do paciente
        let pacienteInfo = '';
        if (tipoAtendimento === 'dependente' && dependenteSelecionado) {
          pacienteInfo = `👥 Paciente: ${dependenteSelecionado.nome} (${dependenteSelecionado.parentesco})\n`;
        } else if (tipoAtendimento === 'usuario') {
          pacienteInfo = `👤 Paciente: ${userDataRef.current.nome} (você)\n`;
        }
        
        addMessage('🎉 Agendamento realizado com sucesso!', 'bot');
        addMessage(`📋 Detalhes do agendamento:\n${pacienteInfo}🏥 Unidade: ${selectedUnidadeRef.current?.nome}\n💉 Vacina: ${agendamentoDataRef.current.vacina_nome}\n📅 Data: ${new Date(agendamentoDataRef.current.data).toLocaleDateString('pt-BR')}\n🕒 Horário: ${agendamentoDataRef.current.horario}\n💳 Pagamento: ${agendamentoDataRef.current.forma_pagamento_nome}\n💰 Valor: R$ ${agendamentoDataRef.current.preco.toFixed(2).replace('.', ',')}`, 'bot');
        addMessage('📞 Entre em contato com a unidade se precisar alterar ou cancelar:', 'bot');
        addMessage(`📞 Telefone: ${selectedUnidadeRef.current?.telefone}`, 'bot');
        
        if (selectedUnidadeRef.current?.email) {
          addMessage(`📧 E-mail: ${selectedUnidadeRef.current.email}`, 'bot');
        }
        
        addMessage('Obrigado por usar nosso sistema! 😊', 'bot');
        
        // Fazer logout após salvar
        await supabase.auth.signOut();
        
        // Opção de fazer novo agendamento
        setTimeout(() => {
          addMessage(
            'Gostaria de fazer outro agendamento?',
            'bot',
            [
              {
                text: '🔄 Novo Agendamento',
                value: 'reiniciar',
                action: () => reiniciarChat()
              },
              {
                text: '❌ Finalizar',
                value: 'finalizar',
                action: () => {
                  addMessage('Muito obrigado! Até logo! 👋', 'bot');
                }
              }
            ]
          );
        }, 2000);
      }
      
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#009688] text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Atendimento Virtual Vaccini</h1>
            <p className="text-sm opacity-90">Encontre a unidade mais próxima de você</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg min-h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[600px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'bot' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === 'bot'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-[#009688] text-white'
                  }`}
                >
                  {message.component ? (
                    <div className="rounded-xl overflow-hidden">
                      {message.component}
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              onClick={option.action}
                              className="w-full px-4 py-2.5 text-sm bg-[#009688] text-white rounded-xl hover:bg-[#00796B] transition-colors font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                              {option.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-[#009688] rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-[#009688] rounded-full animate-bounce delay-100"></div>
                    <div className="w-2.5 h-2.5 bg-[#009688] rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicChat;
