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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref para manter dados do usuário de forma síncrona
  const userDataRef = useRef<UserData>({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cep: ''
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
    
    setStep('resumo');
    addMessage('Obrigado! Agora tenho todas as informações necessárias.', 'bot');
    
    // Mostrar resumo com opções de edição
    setTimeout(() => {
      mostrarResumo();
    }, 1000);
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
                  text: '📞 Ver contatos desta unidade',
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
    setStep('contatos');
    
    addMessage(`📋 Informações de contato da ${unidade.nome}:`, 'bot');
    addMessage(`📞 Telefone: ${unidade.telefone}`, 'bot');
    
    if (unidade.email) {
      addMessage(`📧 E-mail: ${unidade.email}`, 'bot');
    }
    
    if (unidade.horario_funcionamento) {
      addMessage(`🕒 Horário de funcionamento:\n${unidade.horario_funcionamento}`, 'bot');
    }
    
    const enderecoCompleto = `${unidade.endereco}, ${unidade.numero} - ${unidade.bairro}, ${unidade.cidade}/${unidade.estado}`;
    addMessage(`📍 Endereço completo:\n${enderecoCompleto}`, 'bot');
    
    addMessage('💡 Recomendamos entrar em contato antes de comparecer para confirmar disponibilidade e agendar seu atendimento.', 'bot');
    
    // Usar dados passados como parâmetro ou do estado
    const dadosCompletos = dadosUsuario || userData;
    
    // Enviar email para a unidade em background (sem feedback para o usuário)
    console.log('=== DADOS COLETADOS NO CHAT ===');
    console.log('userData utilizado:', dadosCompletos);
    console.log('unidade selecionada:', unidade);
    console.log('===========================');
    enviarEmailParaUnidade(unidade, dadosCompletos);
    
    addMessage('Obrigado por usar nosso atendimento virtual! Tenha um ótimo dia! 😊', 'bot');
    
    // Adicionar opção de reiniciar cadastro
    setTimeout(() => {
      addMessage(
        'Gostaria de fazer um novo cadastro para outra pessoa?',
        'bot',
        [
          {
            text: '🔄 Começar Novo Cadastro',
            value: 'reiniciar',
            action: () => reiniciarChat()
          },
          {
            text: '❌ Finalizar Atendimento',
            value: 'finalizar',
            action: () => {
              addMessage('Muito obrigado! Até logo! 👋', 'bot');
            }
          }
        ]
      );
    }, 2000);
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
