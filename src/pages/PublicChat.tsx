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
    telefone: '',
    cep: ''
  });
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      // Buscar unidades que atendem o CEP usando a mesma lógica do Schedule
      const { data: unidadesCEP, error: errorPermitidas } = await supabase
        .rpc('get_unidades_por_cep', {
          user_cep: cepLimpo
        });

      if (errorPermitidas) {
        console.error('Erro ao verificar unidades permitidas:', errorPermitidas);
        return [];
      }

      if (!unidadesCEP || unidadesCEP.length === 0) {
        return [];
      }

      // Buscar detalhes das unidades
      const unitIds = unidadesCEP.map((u: any) => u.unidade_id);
      const { data: todasUnidades, error: errorUnidades } = await supabase
        .from('unidade')
        .select('*')
        .in('id', unitIds)
        .eq('status', true);

      if (errorUnidades) {
        console.error('Erro ao carregar dados das unidades:', errorUnidades);
        return [];
      }

      // Converter para o formato esperado
      return (todasUnidades || []).map(unit => ({
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

    } catch (error) {
      console.error('Erro ao verificar unidades por CEP:', error);
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

  // Inicialização do chat
  useEffect(() => {
    addMessage('👋 Olá! Sou o assistente virtual da Vaccini.', 'bot');
    addMessage('Vou te ajudar a encontrar a unidade mais próxima de você e fornecer as informações de contato.', 'bot');
    addMessage('Para começar, preciso de algumas informações. Qual é o seu nome completo?', 'bot');
    
    // Adicionar campo de input para nome
    const nameInput = (
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
                  setUserData(prev => ({ ...prev, nome: value }));
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
                setUserData(prev => ({ ...prev, nome: value }));
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
    addMessageWithComponent(nameInput);
  }, []);

  const handleNomeSubmit = (nome: string) => {
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
                  setUserData(prev => ({ ...prev, email: value }));
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
                setUserData(prev => ({ ...prev, email: value }));
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
    setStep('telefone');
    addMessage('Ótimo! Agora preciso do seu telefone para contato.', 'bot');
    
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
                  setUserData(prev => ({ ...prev, telefone: value }));
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
                setUserData(prev => ({ ...prev, telefone: value }));
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
                  setUserData(prev => ({ ...prev, cep: value }));
                  addMessage(value, 'user');
                  handleCEPSubmit(value);
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
                setUserData(prev => ({ ...prev, cep: value }));
                addMessage(value, 'user');
                handleCEPSubmit(value);
              } else {
                toast.error('Por favor, digite um CEP válido (8 dígitos)');
              }
            }}
            className="px-4 py-3 bg-[#009688] text-white rounded-lg hover:bg-[#00796B] transition-colors font-medium"
          >
            Buscar
          </button>
        </div>
      </div>
    );
    addMessageWithComponent(cepInput);
  };

  const handleCEPSubmit = async (cep: string) => {
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
          addMessage('😔 Infelizmente, ainda não temos unidades que atendem sua região.', 'bot');
          addMessage('Mas não se preocupe! Entre em contato conosco pelo telefone (34) 99313-0077 ou e-mail contato@vaccini.com.br que encontraremos uma solução para você.', 'bot');
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
                  action: () => handleUnidadeSelection(unidade)
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

  const handleUnidadeSelection = (unidade: Unidade) => {
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
    
    addMessage('Obrigado por usar nosso atendimento virtual! Tenha um ótimo dia! 😊', 'bot');
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
