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
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserData | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState<'usuario' | 'dependente' | null>(null);
  const [dependenteData, setDependenteData] = useState<DependenteData>({
    nome: '',
    data_nascimento: '',
    parentesco: '',
    sexo: '',
    documento: ''
  });
  const [editingDependente, setEditingDependente] = useState(false);
  const [editingDependenteField, setEditingDependenteField] = useState<keyof DependenteData | null>(null);
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

  // Ref para manter dados do dependente de forma síncrona
  const dependenteDataRef = useRef<DependenteData>({
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

  // Função para buscar vacinas disponíveis na unidade
  const buscarVacinasUnidade = async (unidadeId: number): Promise<Vacina[]> => {
    try {
      console.log('=== BUSCANDO VACINAS DA UNIDADE ===');
      console.log('Unidade ID:', unidadeId);

      // Usar a função RPC que criamos
      const { data: vacinasResult, error } = await supabase.rpc('get_vacinas_unidade', {
        p_unidade_id: unidadeId
      });

      console.log('Resultado RPC get_vacinas_unidade:', { data: vacinasResult, error });

      if (error) {
        console.error('Erro na RPC get_vacinas_unidade:', error);
        return [];
      }

      if (!vacinasResult || vacinasResult.length === 0) {
        console.log('Nenhuma vacina encontrada via RPC para unidade ID:', unidadeId);
        return [];
      }

      // Formatear dados retornados pela RPC
      const vacinas = vacinasResult.map((item: any) => ({
        id: item.vaccine_id,
        nome: item.nome,
        preco: item.preco_customizado || item.preco,
        preco_customizado: item.preco_customizado
      }));

      console.log('Vacinas formatadas:', vacinas);
      return vacinas;

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
      
      // Buscar unidades que atendem o CEP usando a mesma lógica do Schedule
      const { data: unidadesCEP, error: errorPermitidas } = await supabase
        .rpc('get_unidades_por_cep', {
          user_cep: cepLimpo
        });

      console.log('Resultado RPC get_unidades_por_cep:');
      console.log('data:', unidadesCEP);
      console.log('error:', errorPermitidas);

      if (errorPermitidas) {
        console.error('Erro ao verificar unidades permitidas:', errorPermitidas);
        addMessage(`❌ Erro ao buscar unidades: ${errorPermitidas.message}`, 'bot');
        return [];
      }

      if (!unidadesCEP || unidadesCEP.length === 0) {
        console.log('Nenhuma unidade encontrada para o CEP');
        return [];
      }

      // Buscar detalhes das unidades
      const unitIds = unidadesCEP.map((u: any) => u.unidade_id);
      console.log('IDs das unidades encontradas:', unitIds);
      
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
        endereco: unit.logradouro || '',
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
          addMessage('❌ Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.', 'bot');
        } else {
          addMessage(`❌ Erro ao criar conta: ${authError.message}`, 'bot');
        }
        return false;
      }

      if (!authData.user) {
        addMessage('❌ Erro inesperado ao criar conta. Tente novamente.', 'bot');
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
            addMessage('❌ Este e-mail já está cadastrado com senha diferente. Tente fazer login ou use outro e-mail.', 'bot');
            return false;
          }
          
          if (loginData.user) {
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
    setTipoAtendimento(null);
    setDependenteData({
      nome: '',
      data_nascimento: '',
      parentesco: '',
      sexo: '',
      documento: ''
    });
    dependenteDataRef.current = {
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
    setHorariosDisponiveis([]);
    setFormasPagamento([]);
    
    // Reiniciar o chat
    setTimeout(() => {
      addMessage('👋 Olá! Sou o assistente virtual da Vaccini.', 'bot');
      addMessage('Vou te ajudar a encontrar a unidade mais próxima de você e fornecer as informações de contato.', 'bot');
      addMessage('Para começar, preciso de algumas informações. Qual é o seu nome completo?', 'bot');
      
      // Adicionar campo de input para nome
      const nameInput = createNameInput();
      addMessageWithComponent(nameInput);
    }, 100);
  };

  // Função para criar input de nome (reutilizável)
  const createNameInput = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id="nome-input"
          type="text"
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
    addMessage('Para começar, preciso de algumas informações. Qual é o seu nome completo?', 'bot');
    
    // Adicionar campo de input para nome
    const nameInput = createNameInput();
    addMessageWithComponent(nameInput);
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
    
    setStep('email');
    addMessage(`Prazer em conhecê-lo, ${nome}! Agora preciso do seu e-mail para contato.`, 'bot');
    
    const emailInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="email-input"
            type="email"
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
          />
          <button
            onClick={() => {
              const input = document.getElementById('email-input') as HTMLInputElement;
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
            Enviar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(emailInput);
  };

  const handleEmailSubmit = (email: string) => {
    console.log('=== DEBUG EMAIL ===');
    console.log('Email recebido:', email);
    
    // Atualizar ref
    userDataRef.current.email = email;
    console.log('userDataRef após email:', userDataRef.current);
    
    // Atualizar state também
    setUserData(prev => {
      const updated = { ...prev, email };
      console.log('userData state após email:', updated);
      return updated;
    });
    
    // Se estamos editando, voltar para o resumo
    if (isEditing) {
      addMessage(`✅ Email atualizado para: ${email}`, 'bot');
      setTimeout(() => {
        mostrarResumo();
      }, 1000);
      return;
    }
    
    setStep('senha');
    addMessage('Ótimo! Agora preciso que você crie uma senha para sua conta (mínimo 6 caracteres).', 'bot');
    
    const senhaInput = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="senha-input"
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
            type="tel"
            placeholder="Digite seu telefone (ex: 11999999999)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
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
            type="text"
            placeholder="Digite seu CEP (ex: 01234567)"
            maxLength={9}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688]"
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
    
    setStep('tipo_atendimento');
    addMessage('Obrigado! Agora tenho todas as informações básicas.', 'bot');
    
    // Perguntar sobre o tipo de atendimento
    setTimeout(() => {
      addMessage(
        'Para quem é este atendimento?',
        'bot',
        [
          {
            text: '👤 Para mim (usuário principal)',
            value: 'usuario',
            action: () => handleTipoAtendimento('usuario')
          },
          {
            text: '👥 Para um dependente',
            value: 'dependente',
            action: () => handleTipoAtendimento('dependente')
          }
        ]
      );
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
    }
  };

  const handleDependenteNome = (nome: string) => {
    setDependenteData(prev => ({ ...prev, nome }));
    dependenteDataRef.current.nome = nome;
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
    setDependenteData(prev => ({ ...prev, data_nascimento: data }));
    dependenteDataRef.current.data_nascimento = data;
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
    setDependenteData(prev => ({ ...prev, parentesco }));
    dependenteDataRef.current.parentesco = parentesco;
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
                  setDependenteData(prev => ({ ...prev, parentesco: value }));
                  dependenteDataRef.current.parentesco = value;
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
                setDependenteData(prev => ({ ...prev, parentesco: value }));
                dependenteDataRef.current.parentesco = value;
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
    setDependenteData(prev => ({ ...prev, sexo }));
    dependenteDataRef.current.sexo = sexo;
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
    setDependenteData(prev => ({ ...prev, documento }));
    dependenteDataRef.current.documento = documento;
    setStep('resumo_dependente');
    addMessage('Perfeito! Agora tenho todos os dados necessários.', 'bot');
    
    setTimeout(() => {
      mostrarResumoDependente();
    }, 1000);
  };

  const mostrarResumoDependente = () => {
    const dados = userDataRef.current;
    const dadosDep = dependenteDataRef.current;
    
    addMessage('📋 Resumo dos dados:', 'bot');
    addMessage(
      `👤 RESPONSÁVEL:\nNome: ${dados.nome}\nEmail: ${dados.email}\nSenha: ${'*'.repeat(dados.senha.length)}\nTelefone: ${dados.telefone}\nCEP: ${dados.cep}`, 
      'bot'
    );
    addMessage(
      `👥 DEPENDENTE:\nNome: ${dadosDep.nome}\nData Nascimento: ${new Date(dadosDep.data_nascimento).toLocaleDateString('pt-BR')}\nParentesco: ${dadosDep.parentesco}\nSexo: ${dadosDep.sexo === 'M' ? 'Masculino' : 'Feminino'}\nCPF: ${dadosDep.documento}`, 
      'bot',
      [
        {
          text: '✅ Confirmar e Cadastrar',
          value: 'confirm',
          action: () => confirmarCadastroDependente()
        },
        {
          text: '✏️ Editar Dados do Responsável',
          value: 'edit-responsavel',
          action: () => mostrarResumo()
        }
      ]
    );
  };

  const confirmarCadastroDependente = async () => {
    // Validar dados antes do cadastro
    const dadosUsuario = userDataRef.current;
    const dadosDep = dependenteDataRef.current;
    
    console.log('=== VALIDANDO DADOS ANTES DO CADASTRO ===');
    console.log('Dados do usuário:', dadosUsuario);
    console.log('Dados do dependente:', dadosDep);
    
    // Validar dados do usuário
    if (!dadosUsuario.nome || !dadosUsuario.email || !dadosUsuario.senha || !dadosUsuario.telefone || !dadosUsuario.cep) {
      addMessage('❌ Erro: Dados do usuário incompletos. Por favor, reinicie o processo.', 'bot');
      return;
    }
    
    // Validar dados do dependente
    if (!dadosDep.nome || !dadosDep.data_nascimento || !dadosDep.parentesco || !dadosDep.sexo || !dadosDep.documento) {
      addMessage('❌ Erro: Dados do dependente incompletos. Por favor, reinicie o processo.', 'bot');
      console.log('Campos faltando no dependente:', {
        nome: !dadosDep.nome,
        data_nascimento: !dadosDep.data_nascimento,
        parentesco: !dadosDep.parentesco,
        sexo: !dadosDep.sexo,
        documento: !dadosDep.documento
      });
      return;
    }
    
    // Validar formato da data
    if (!validarDataNascimento(dadosDep.data_nascimento)) {
      addMessage('❌ Erro: Data de nascimento inválida.', 'bot');
      return;
    }
    
    setStep('cadastrando');
    addMessage('✅ Dados validados! Vou criar a conta do responsável e cadastrar o dependente...', 'bot');
    
    // Realizar o cadastro
    const sucesso = await cadastrarDependente(dadosUsuario, dadosDep);
    
    if (sucesso) {
      // Após cadastro, buscar unidades
      setTimeout(() => {
        addMessage('🔍 Agora vou buscar as unidades que atendem sua região...', 'bot');
        setStep('verificando');
        handleCEPSubmit(userDataRef.current.cep);
      }, 2000);
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
    addMessage('Escolha a vacina que deseja agendar:', 'bot');
    
    // Mostrar vacinas disponíveis
    vacinas.forEach(vacina => {
      addMessage(
        `💉 ${vacina.nome}\n💰 Preço: R$ ${vacina.preco.toFixed(2).replace('.', ',')}`,
        'bot',
        [
          {
            text: '✅ Escolher esta vacina',
            value: vacina.id.toString(),
            action: () => handleVacinaSelection(vacina)
          }
        ]
      );
    });
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
    setAgendamentoData(prev => ({
      ...prev,
      vacina_id: vacina.id,
      vacina_nome: vacina.nome,
      preco: vacina.preco
    }));
    
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
    setAgendamentoData(prev => ({ ...prev, data }));
    
    // Determinar dia da semana
    const dataObj = new Date(data);
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[dataObj.getDay()];
    
    setStep('horario');
    addMessage(`📅 Data selecionada: ${dataObj.toLocaleDateString('pt-BR')} (${diaSemana})`, 'bot');
    addMessage('🕒 Agora escolha o horário disponível:', 'bot');
    
    // Gerar horários fixos das 8h às 18h (de 30 em 30 minutos)
    const horariosDisponiveis: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const horarioFormatado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        horariosDisponiveis.push(horarioFormatado);
      }
    }
    
    console.log('Horários fixos gerados:', horariosDisponiveis);
    setHorariosDisponiveis(horariosDisponiveis);
    
    // Dropdown para seleção de horário
    const horarioDropdown = (
      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            id="horario-select"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#009688] bg-white"
            defaultValue=""
          >
            <option value="" disabled>Selecione um horário</option>
            {horariosDisponiveis.map(horario => (
              <option key={horario} value={horario}>
                {horario}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const select = document.getElementById('horario-select') as HTMLSelectElement;
              const horarioSelecionado = select.value;
              if (horarioSelecionado) {
                addMessage(horarioSelecionado, 'user');
                handleHorarioSelection(horarioSelecionado);
              } else {
                toast.error('Por favor, selecione um horário');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
    
    addMessageWithComponent(horarioDropdown);
  };

  const handleHorarioSelection = async (horario: string) => {
    setAgendamentoData(prev => ({ ...prev, horario }));
    addMessage(horario, 'user');
    
    setStep('pagamento');
    addMessage('💳 Agora escolha a forma de pagamento:', 'bot');
    
    // Buscar formas de pagamento
    const formas = await buscarFormasPagamento();
    setFormasPagamento(formas);
    
    if (formas.length === 0) {
      addMessage('❌ Erro ao carregar formas de pagamento. Tente novamente.', 'bot');
      return;
    }
    
    // Mostrar formas de pagamento
    const pagamentoOptions = formas.map(forma => ({
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

  const handlePagamentoSelection = (formaPagamento: {id: number, nome: string}) => {
    setAgendamentoData(prev => ({
      ...prev,
      forma_pagamento_id: formaPagamento.id,
      forma_pagamento_nome: formaPagamento.nome.trim()
    }));
    
    addMessage(formaPagamento.nome.trim(), 'user');
    setStep('confirmacao');
    
    // Mostrar resumo do agendamento
    mostrarResumoAgendamento();
  };

  const mostrarResumoAgendamento = () => {
    const agendamento = agendamentoData;
    const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
    
    addMessage('📋 Resumo do seu agendamento:', 'bot');
    addMessage(
      `🏥 Unidade: ${selectedUnidade?.nome}\n💉 Vacina: ${agendamento.vacina_nome}\n📅 Data: ${dataFormatada}\n🕒 Horário: ${agendamento.horario}\n💳 Pagamento: ${agendamento.forma_pagamento_nome}\n💰 Valor: R$ ${agendamento.preco.toFixed(2).replace('.', ',')}`,
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
            text: '✅ Escolher esta vacina',
            value: vacina.id.toString(),
            action: () => handleVacinaSelection(vacina)
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
      const unidadeId = selectedUnidade!.id;
      
      // Salvar agendamento
      const sucesso = await salvarAgendamento(agendamentoData, userId, unidadeId);
      
      if (sucesso) {
        addMessage('🎉 Agendamento realizado com sucesso!', 'bot');
        addMessage(`📋 Detalhes do agendamento:\n🏥 Unidade: ${selectedUnidade?.nome}\n💉 Vacina: ${agendamentoData.vacina_nome}\n📅 Data: ${new Date(agendamentoData.data).toLocaleDateString('pt-BR')}\n🕒 Horário: ${agendamentoData.horario}\n💳 Pagamento: ${agendamentoData.forma_pagamento_nome}\n💰 Valor: R$ ${agendamentoData.preco.toFixed(2).replace('.', ',')}`, 'bot');
        addMessage('📞 Entre em contato com a unidade se precisar alterar ou cancelar:', 'bot');
        addMessage(`📞 Telefone: ${selectedUnidade?.telefone}`, 'bot');
        
        if (selectedUnidade?.email) {
          addMessage(`📧 E-mail: ${selectedUnidade.email}`, 'bot');
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
