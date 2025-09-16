import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Constante global para os dias da semana
const diasSemana = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado'
];

interface Unit {
  id: number;
  nome: string;
  status: boolean;
  atende_aplicativo: boolean;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface Vaccine {
  vacina_id: number;
  vacina_nome: string;
  preco: number;
  status: string;
  total_doses: number;
  valor_plano?: number | null;
  tem_convenio?: boolean;
}

interface UnitSchedule {
  id: number;
  unit_id: number;
  dia_da_semana: string;
  horario_inicio: string;
  horario_fim: string;
  qtd_agendamentos: number | null;
}

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

const VaccineChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('initial');
  const [selectedMode, setSelectedMode] = useState<'quote' | 'direct' | null>(null);
  const [quotes, setQuotes] = useState([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedVaccines, setSelectedVaccines] = useState<{ vaccineId: number; name: string; price: number }[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<UnitSchedule[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [unidadesPermitidas, setUnidadesPermitidas] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Efeito para rolar para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para adicionar mensagens ao chat
  const addMessage = (text: string, type: 'bot' | 'user', options?: Message['options']) => {
    setMessages(prev => [...prev, { text, type, options }]);
    // Pequeno delay para garantir que o scroll aconteça após a renderização
    setTimeout(scrollToBottom, 100);
  };

  // Função para adicionar mensagem com componente
  const addMessageWithComponent = (component: React.ReactNode) => {
    setMessages(prev => [...prev, { text: '', type: 'bot', component }]);
    // Pequeno delay para garantir que o scroll aconteça após a renderização
    setTimeout(scrollToBottom, 100);
  };

  // Função para limpar todos os dados
  const clearAllData = () => {
    setMessages([]);
    setStep('initial');
    setSelectedMode(null);
    setQuotes([]);
    setVaccines([]);
    setUnits([]);
    setSelectedQuote(null);
    setSelectedVaccines([]);
    setSelectedUnit(null);
    setAvailableDays([]);
    setSelectedDate(null);
    setAvailableTimeSlots([]);
    setSelectedTime(null);
    setPaymentMethods([]);
    setSelectedPaymentMethod(null);
    setUnidadesPermitidas([]);
    setIsLoading(false);

    // Adicionar mensagens iniciais novamente
    setTimeout(() => {
      addMessage('👋 Olá! Eu sou o assistente virtual da Vaccini.', 'bot');
      addMessage('Como posso ajudar você hoje?', 'bot', [
        {
          text: 'Agendar Vacinação',
          value: 'agendar',
          action: () => handleInitialChoice()
        }
      ]);
    }, 100);
  };

  // Função para confirmar o fechamento do chat
  const handleClose = () => {
    if (step !== 'initial' && messages.length > 2) {
      addMessage('⚠️ Se você fechar o chat, todos os dados do agendamento serão perdidos.', 'bot', [
        {
          text: '✅ Sim, fechar chat',
          value: 'close',
          action: () => {
            clearAllData();
            setIsVisible(false);
          }
        },
        {
          text: '❌ Não, continuar agendamento',
          value: 'continue',
          action: () => {
            // Não faz nada, apenas mantém o chat aberto
          }
        }
      ]);
    } else {
      clearAllData();
      setIsVisible(false);
    }
  };

  // Inicialização do chat
  useEffect(() => {
    addMessage('👋 Olá! Eu sou o assistente virtual da Vaccini.', 'bot');
    addMessage('Como posso ajudar você hoje?', 'bot', [
      {
        text: 'Agendar Vacinação',
        value: 'agendar',
        action: () => handleInitialChoice()
      }
    ]);
  }, []);

  const handleInitialChoice = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Você precisa estar logado para agendar uma vacinação.', 'bot');
        navigate('/login');
        return;
      }

      addMessage('Como você deseja realizar o agendamento?', 'bot', [
        {
          text: 'Usar Orçamento Existente',
          value: 'quote',
          action: () => handleModeSelection('quote')
        },
        {
          text: 'Agendamento Direto',
          value: 'direct',
          action: () => handleModeSelection('direct')
        }
      ]);
    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao iniciar o agendamento.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelection = async (mode: 'quote' | 'direct') => {
    setIsLoading(true);
    setSelectedMode(mode);
    try {
      if (mode === 'quote') {
        const { data: orcamentos } = await supabase
          .from('view_orcamentos_com_vacinas')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        setQuotes(orcamentos || []);
        
        if (!orcamentos || orcamentos.length === 0) {
          addMessage('Você ainda não possui orçamentos.', 'bot');
          addMessage('Deseja criar um novo orçamento?', 'bot', [
            {
              text: 'Criar Orçamento',
              value: 'create_quote',
              action: () => navigate('/quote')
            },
            {
              text: 'Fazer Agendamento Direto',
              value: 'direct',
              action: () => handleModeSelection('direct')
            }
          ]);
          return;
        }

        addMessage('Selecione um orçamento:', 'bot');
        orcamentos.forEach(quote => {
          addMessage(
            `Data: ${new Date(quote.created_at).toLocaleDateString()}
Vacinas: ${quote.nomes_vacinas.join(', ')}
Total: R$ ${quote.total.toFixed(2)}`,
            'bot',
            [
              {
                text: 'Selecionar este orçamento',
                value: quote.id.toString(),
                action: () => handleQuoteSelection(quote)
              }
            ]
          );
        });
      } else {
        const { data: vacinas } = await supabase
          .from('vw_vacinas_esquemas')
          .select('*')
          .eq('status', 'Ativo');

        if (!vacinas || vacinas.length === 0) {
          addMessage('❌ Não há vacinas disponíveis no momento.', 'bot');
          return;
        }

        // Buscar preços de convênio para as vacinas
        const vacinaIds = vacinas.map(v => v.vacina_id);
        
        const { data: precosConvenio } = await supabase
          .from('convenio_vacina_precos')
          .select(`
            vacina_id,
            preco,
            convenios!inner(nome)
          `)
          .in('vacina_id', vacinaIds)
          .eq('ativo', true);

        // Combinar dados das vacinas com informações de convênio
        const vacinasComConvenio = vacinas.map(vaccine => {
          const precosVacina = precosConvenio?.filter(p => p.vacina_id === vaccine.vacina_id);
          
          // Filtrar apenas preços > 0 para calcular o mínimo
          const precosValidos = precosVacina?.filter(p => p.preco > 0) || [];
          const precoMinimo = precosValidos.length > 0 
            ? Math.min(...precosValidos.map(p => p.preco))
            : null;
          
          // Considerar que tem convênio se há preços válidos (> 0)
          const temConvenio = precosValidos.length > 0;
          
          return {
            ...vaccine,
            valor_plano: precoMinimo,
            tem_convenio: temConvenio
          };
        });

        // Filtrar vacinas que têm dose = 0 ou preço = 0 (não configuradas)
        const vacinasConfiguradas = vacinasComConvenio.filter(vaccine => 
          vaccine.total_doses > 0 && vaccine.preco > 0
        );

        setVaccines(vacinasConfiguradas);
        
        if (vacinasConfiguradas.length === 0) {
          addMessage('❌ Não há vacinas disponíveis no momento.', 'bot');
          return;
        }

        addMessage('Selecione as vacinas desejadas:', 'bot');
        vacinasConfiguradas.forEach(vaccine => {
          const precoTexto = vaccine.tem_convenio
            ? `Preço: a partir de R$ ${vaccine.valor_plano!.toFixed(2)} (convênio)`
            : '';

          addMessage(
            `${vaccine.vacina_nome}
Doses: ${vaccine.total_doses}${precoTexto ? '\n' + precoTexto : ''}`,
            'bot',
            [
              {
                text: vaccine.tem_convenio 
                  ? 'Agendar Automaticamente' 
                  : 'Solicitar Agendamento',
                value: vaccine.vacina_id.toString(),
                action: () => handleVaccineSelection(vaccine)
              }
            ]
          );
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao carregar os dados.', 'bot');
    } finally {
      setIsLoading(false);
      setStep('list');
    }
  };

  const handleQuoteSelection = async (quote: any) => {
    setIsLoading(true);
    try {
      setSelectedQuote(quote);
      
      // Buscar unidades que atendem ao CEP do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Você precisa estar logado para agendar uma vacinação.', 'bot');
        navigate('/login');
        return;
      }

      const { data: unidades, error: errorUnidades } = await supabase
        .rpc('verifica_unidade_usuario', {
          user_id: user.id
        });

      if (errorUnidades) {
        console.error('Erro ao verificar unidades:', errorUnidades);
        addMessage('❌ Ocorreu um erro ao carregar as unidades.', 'bot');
        return;
      }

      if (!unidades || unidades.length === 0) {
        addMessage('❌ Nenhuma unidade atende ao seu CEP.', 'bot');
        return;
      }

      // Buscar detalhes das unidades
      const unitIds = unidades.map((u: any) => u.unidade_id);
      const { data: unitDetails, error: unitError } = await supabase
        .from('unidade')
        .select('*')
        .in('id', unitIds)
        .eq('status', true);

      if (unitError) {
        console.error('Erro ao buscar detalhes das unidades:', unitError);
        addMessage('❌ Ocorreu um erro ao carregar os detalhes das unidades.', 'bot');
        return;
      }

      setUnits(unitDetails || []);

      // Mostrar resumo do orçamento selecionado
      addMessage('📋 Orçamento selecionado:', 'bot');
      addMessage(`Data: ${new Date(quote.created_at).toLocaleDateString()}`, 'bot');
      addMessage('💉 Vacinas:', 'bot');
      quote.nomes_vacinas.forEach((nome: string) => {
        addMessage(`✓ ${nome}`, 'bot');
      });
      addMessage(`💰 Valor total: R$ ${Number(quote.total).toFixed(2)}`, 'bot');

      // Mostrar unidades disponíveis
      addMessage('Escolha a unidade de atendimento:', 'bot');
      unitDetails?.forEach(unit => {
        const atendimentoViaApp = unit.atende_aplicativo;
        const enderecoCompleto = `${unit.nome}\n${unit.endereco || ''}, ${unit.numero || ''}\n${unit.bairro || ''} - ${unit.cidade || ''}/${unit.estado || ''}${!atendimentoViaApp ? '\n⚠️ Esta unidade não atende via aplicativo' : ''}`;
        
        addMessage(
          enderecoCompleto.replace(/\s+,\s+/g, ',').replace(/\s+-\s+/g, ' - ').replace(/\s+/g, ' ').trim(),
          'bot',
          [
            {
              text: 'Selecionar esta unidade',
              value: unit.id.toString(),
              action: () => {
                if (!atendimentoViaApp) {
                  addMessage('❌ Esta unidade não atende seu CEP.', 'bot');
                  return;
                }
                handleUnitSelection(unit.id);
              }
            }
          ]
        );
      });

      setStep('unit');
    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao processar o orçamento.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolicitacaoAgendamento = async (vaccine: any) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Você precisa estar logado para solicitar um agendamento.', 'bot');
        return;
      }

      // Salvar solicitação na tabela
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .insert({
          user_id: user.id,
          vacina_id: vaccine.vacina_id,
          observacoes: `Solicitação via chatbot - Vacina: ${vaccine.vacina_nome}`,
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
            action: () => handleModeSelection('direct')
          },
          {
            text: '❌ Finalizar',
            value: 'finalizar',
            action: () => {
              addMessage('Muito obrigado! Até logo! 👋', 'bot');
              clearAllData();
            }
          }
        ]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      addMessage('❌ Erro inesperado. Tente novamente.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVaccineSelection = async (vaccine: any) => {
    try {
      // Se a vacina não tem convênio, mostrar mensagem diferente
      if (!vaccine.tem_convenio) {
        addMessage(`📋 Solicitação de agendamento para: ${vaccine.vacina_nome}`, 'bot');
        addMessage('💬 Esta vacina não possui convênio disponível no momento.', 'bot');
        addMessage('📞 Um de nossos atendentes entrará em contato com você para finalizar o agendamento e informar o valor.', 'bot');
        addMessage('📧 Você receberá um e-mail ou ligação em breve com as informações necessárias.', 'bot');
        
        // Opções para continuar
        addMessage('O que você deseja fazer?', 'bot', [
          {
            text: '✅ Confirmar solicitação',
            value: 'confirmar_solicitacao',
            action: () => handleSolicitacaoAgendamento(vaccine)
          },
          {
            text: '🔍 Ver outras vacinas',
            value: 'outras_vacinas',
            action: () => handleModeSelection('direct')
          },
          {
            text: '❌ Cancelar',
            value: 'cancelar',
            action: () => {
              addMessage('Solicitação cancelada.', 'bot');
              clearAllData();
            }
          }
        ]);
        return;
      }

      const isSelected = selectedVaccines.some(v => v.vaccineId === vaccine.vacina_id);
      let updatedVaccines;
      
      if (isSelected) {
        // Remover vacina
        updatedVaccines = selectedVaccines.filter(v => v.vaccineId !== vaccine.vacina_id);
      } else {
        // Adicionar vacina (usar valor do convênio se disponível)
        const precoParaAgendamento = vaccine.valor_plano || vaccine.preco;
        updatedVaccines = [...selectedVaccines, {
          vaccineId: vaccine.vacina_id,
          name: vaccine.vacina_nome,
          price: precoParaAgendamento,
          doses: vaccine.total_doses,
          tem_convenio: vaccine.tem_convenio
        }];
      }

      setSelectedVaccines(updatedVaccines);

      // Mostrar resumo atualizado
      addMessage('📋 Vacinas selecionadas:', 'bot');
      updatedVaccines.forEach(v => {
        const precoTexto = v.tem_convenio
          ? `a partir de R$ ${v.price.toFixed(2)} (convênio)`
          : `R$ ${v.price.toFixed(2)}`;
        addMessage(
          `✓ ${v.name} - ${v.doses} doses - ${precoTexto}`,
          'bot',
          [
            {
              text: '❌ Remover esta vacina',
              value: v.vaccineId.toString(),
              action: () => {
                const newVaccines = updatedVaccines.filter(vac => vac.vaccineId !== v.vaccineId);
                setSelectedVaccines(newVaccines);
                
                // Atualizar mensagem com nova lista
                addMessage('📋 Vacinas selecionadas:', 'bot');
                newVaccines.forEach(vac => {
                  addMessage(
                    `✓ ${vac.name} - ${vac.doses} doses - R$ ${vac.price}`,
                    'bot',
                    [
                      {
                        text: '❌ Remover esta vacina',
                        value: vac.vaccineId.toString(),
                        action: () => {
                          const finalVaccines = newVaccines.filter(v => v.vaccineId !== vac.vaccineId);
                          setSelectedVaccines(finalVaccines);
                          
                          // Atualizar mensagem com lista final
                          addMessage('📋 Vacinas selecionadas:', 'bot');
                          finalVaccines.forEach(v => {
                            addMessage(
                              `✓ ${v.name} - ${v.doses} doses - R$ ${v.price}`,
                              'bot',
                              [
                                {
                                  text: '❌ Remover esta vacina',
                                  value: v.vaccineId.toString(),
                                  action: () => handleVaccineSelection({ 
                                    vacina_id: v.vaccineId,
                                    vacina_nome: v.name,
                                    preco: v.price,
                                    total_doses: v.doses
                                  })
                                }
                              ]
                            );
                          });
                          
                          const valorTotal = finalVaccines.reduce((acc, v) => acc + v.price, 0);
                          addMessage(`💰 Valor total: R$ ${valorTotal}`, 'bot');
                        }
                      }
                    ]
                  );
                });
                
                const valorTotal = newVaccines.reduce((acc, v) => acc + v.price, 0);
                addMessage(`💰 Valor total: R$ ${valorTotal}`, 'bot');
              }
            }
          ]
        );
      });
      
      const valorTotal = updatedVaccines.reduce((acc, v) => acc + v.price, 0);
      addMessage(`💰 Valor total: R$ ${valorTotal}`, 'bot');

      // Mostrar opções de ação
      if (updatedVaccines.length > 0) {
        addMessage('O que você deseja fazer?', 'bot', [
          {
            text: '✅ Confirmar seleção e continuar',
            value: 'confirmar',
            action: () => handleUnitSelection(null)
          },
          {
            text: '➕ Selecionar mais vacinas',
            value: 'mais_vacinas',
            action: () => handleModeSelection('direct')
          }
        ]);
      } else {
        addMessage('Selecione pelo menos uma vacina para continuar.', 'bot');
        handleModeSelection('direct');
      }
    } catch (err) {
      console.error('Erro completo:', err);
      addMessage('❌ Ocorreu um erro ao processar a seleção da vacina.', 'bot');
    }
  };

  const isDayAvailable = (date: Date) => {
    const dayOfWeek = diasSemana[date.getDay()].split(' ')[0];
    return true; // Todos os dias estão disponíveis
  };

  const handleUnitSelection = async (unitId: number | null) => {
    setIsLoading(true);
    try {
      // Se não recebeu unitId, mostrar lista de unidades
      if (!unitId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          addMessage('❌ Você precisa estar logado para agendar uma vacinação.', 'bot');
          navigate('/login');
          return;
        }

        const { data: unidadesCEP, error: errorPermitidas } = await supabase
          .rpc('verifica_unidade_usuario', {
            user_id: user.id
          });

        if (errorPermitidas) {
          console.error('Erro ao verificar unidades permitidas:', errorPermitidas);
          addMessage('❌ Erro ao carregar unidades.', 'bot');
          return;
        }

        const idsUnidadesPermitidas = unidadesCEP?.map(u => u.unidade_id) || [];
        setUnidadesPermitidas(idsUnidadesPermitidas);

        const { data: todasUnidades, error: errorUnidades } = await supabase
          .from('unidade')
          .select('*')
          .eq('status', true);

        if (errorUnidades) {
          console.error('Erro ao carregar dados das unidades:', errorUnidades);
          addMessage('❌ Erro ao carregar dados das unidades.', 'bot');
          return;
        }

        setUnits(todasUnidades || []);

        addMessage('Escolha a unidade de atendimento:', 'bot');
        todasUnidades?.forEach(unit => {
          const atendeCEP = idsUnidadesPermitidas.includes(unit.id);
          const enderecoCompleto = `${unit.nome}\n${unit.endereco || ''}, ${unit.numero || ''}\n${unit.bairro || ''} - ${unit.cidade || ''}/${unit.estado || ''}${!unit.atende_aplicativo ? '\n⚠️ Esta unidade não atende via aplicativo' : ''}`;
          
          addMessage(
            enderecoCompleto.replace(/\s+,\s+/g, ',').replace(/\s+-\s+/g, ' - ').replace(/\s+/g, ' ').trim(),
            'bot',
            [
              {
                text: 'Selecionar esta unidade',
                value: unit.id.toString(),
                action: () => {
                  if (!atendeCEP) {
                    addMessage('❌ Esta unidade não atende seu CEP.', 'bot');
                    return;
                  }
                  if (!unit.atende_aplicativo) {
                    navigate('/unit-unavailable');
                    return;
                  }
                  handleUnitSelection(unit.id);
                }
              }
            ]
          );
        });
        return;
      }

      // Se recebeu unitId, selecionar a unidade e mostrar calendário
      setSelectedUnit(unitId);

      // Buscar horários disponíveis para a unidade
      const { data: horarios, error } = await supabase
        .from('unit_schedules')
        .select('dia_da_semana')
        .eq('unit_id', unitId)
        .gt('qtd_agendamentos', 0);

      if (error) {
        console.error('Erro ao buscar horários:', error);
        addMessage('❌ Erro ao carregar horários disponíveis.', 'bot');
        return;
      }

      // Definir dias disponíveis
      const diasDisponiveis = horarios?.map(h => h.dia_da_semana) || [];
      setAvailableDays(diasDisponiveis);

      // Mostrar calendário
      addMessage('Selecione uma data:', 'bot');
      addMessage(`ℹ️ Esta unidade atende nos seguintes dias: ${diasDisponiveis.join(', ')}`, 'bot');
      
      const calendarComponent = (
        <div className="bg-white p-4 rounded-lg shadow">
          <input
            type="date"
            className="w-full p-2 border rounded-lg"
            value={selectedDate || ''}
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (!selectedValue) {
                addMessage('❌ Por favor, selecione uma data válida.', 'bot');
                return;
              }

              const date = new Date(selectedValue);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (date < today) {
                addMessage('❌ Por favor, selecione uma data futura.', 'bot');
                return;
              }

              const diaDaSemana = diasSemana[date.getDay()];
              console.log('Dia selecionado:', diaDaSemana);
              console.log('Dias disponíveis:', diasDisponiveis);

              // Verificar se o dia está disponível
              if (!diasDisponiveis.includes(diaDaSemana)) {
                addMessage(`❌ Esta unidade não atende ${diaDaSemana.toLowerCase()}.`, 'bot');
                addMessage(`ℹ️ Dias de atendimento disponíveis: ${diasDisponiveis.join(', ')}`, 'bot');
                return;
              }

              setSelectedDate(selectedValue);
              handleDateSelection(diaDaSemana);
            }}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      );

      addMessageWithComponent(calendarComponent);
      setStep('date');

    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao processar a seleção da unidade.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelection = async (diaDaSemana: string) => {
    setIsLoading(true);
    try {
      if (!selectedUnit) {
        addMessage('❌ Por favor, selecione uma unidade primeiro.', 'bot');
        return;
      }

      // Buscar horários disponíveis
      const { data: horarios, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', selectedUnit)
        .eq('dia_da_semana', diaDaSemana)
        .gt('qtd_agendamentos', 0);

      if (error) {
        console.error('Erro ao buscar horários:', error);
        throw new Error(`Erro ao buscar horários: ${error.message}`);
      }

      if (!horarios || horarios.length === 0) {
        addMessage('❌ Não há horários disponíveis para esta data.', 'bot');
        return;
      }

      setAvailableTimeSlots(horarios);
      addMessage('Selecione um horário:', 'bot');

      horarios.forEach((slot) => {
        const inicio = formatTime(slot.horario_inicio);
        const fim = formatTime(slot.horario_fim);
        const timeButton = (
          <button
            onClick={() => handleTimeSelection(inicio)}
            className="w-full px-4 py-2.5 text-sm bg-[#009688] text-white rounded-xl hover:bg-[#00796B] transition-colors font-medium shadow-sm hover:shadow-md active:scale-[0.98] mb-2"
          >
            {`${inicio} - ${fim} (${slot.qtd_agendamentos} vagas)`}
          </button>
        );
        addMessageWithComponent(timeButton);
      });

      setStep('time');
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      addMessage('❌ Erro ao carregar os horários disponíveis. Por favor, tente novamente.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (date: string | Date): string => {
    if (!date) return '';
    try {
      if (typeof date === 'string') {
        return format(new Date(date), 'yyyy-MM-dd');
      }
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  // Função para formatar horário
  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const timeString = time.split('T')[1] || time;
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch (error) {
      console.error('Erro ao formatar horário:', error);
      return time;
    }
  };

  const handleTimeSelection = async (time: string) => {
    setIsLoading(true);
    try {
      if (!time) {
        addMessage('❌ Por favor, selecione um horário válido.', 'bot');
        return;
      }

      console.log('Horário selecionado:', time);
      setSelectedTime(time);

      // Buscar formas de pagamento
      const { data: formasPagamento, error } = await supabase
        .from('ref_formas_pagamentos')
        .select('*');

      if (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        addMessage('❌ Ocorreu um erro ao carregar as formas de pagamento.', 'bot');
        return;
      }

      if (!formasPagamento || formasPagamento.length === 0) {
        addMessage('❌ Não há formas de pagamento disponíveis.', 'bot');
        return;
      }

      setPaymentMethods(formasPagamento);

      // Mostrar formas de pagamento como botões em um container flex com wrap
      addMessage('Escolha a forma de pagamento:', 'bot');
      const paymentButtonsContainer = (
        <div className="flex flex-wrap gap-2">
          {formasPagamento.map(method => (
            <button
              key={method.id}
              onClick={() => handlePaymentSelection(method.id)}
              className="px-4 py-2.5 text-sm bg-[#009688] text-white rounded-xl hover:bg-[#00796B] transition-colors font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              {method.nome}
            </button>
          ))}
        </div>
      );
      addMessageWithComponent(paymentButtonsContainer);

      setStep('payment');
    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao processar a seleção do horário.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSelection = async (methodId: number) => {
    setIsLoading(true);
    try {
      setSelectedPaymentMethod(methodId);

      // Mostrar resumo do agendamento
      addMessage('📋 Resumo do agendamento:', 'bot');
      if (selectedMode === 'quote') {
        addMessage('💉 Vacinas:', 'bot');
        selectedQuote.nomes_vacinas.forEach((nome: string) => {
          addMessage(`✓ ${nome} - R$ ${selectedQuote.total}`, 'bot');
        });
        addMessage(`💰 Valor total: R$ ${Number(selectedQuote.total).toFixed(2)}`, 'bot');
      } else {
        addMessage('💉 Vacinas:', 'bot');
        selectedVaccines.forEach(v => {
          const precoTexto = v.tem_convenio
            ? `a partir de R$ ${v.price.toFixed(2)} (convênio)`
            : `R$ ${v.price.toFixed(2)}`;
          addMessage(`✓ ${v.name} - ${precoTexto}`, 'bot');
        });
        const valorTotal = selectedVaccines.reduce((acc, v) => acc + v.price, 0);
        const temConvenio = selectedVaccines.some(v => v.tem_convenio);
        const textoTotal = temConvenio 
          ? `💰 Valor total: a partir de R$ ${valorTotal.toFixed(2)} (convênio)`
          : `💰 Valor total: R$ ${valorTotal.toFixed(2)}`;
        addMessage(textoTotal, 'bot');
      }

      // Opções de confirmação
      addMessage('Deseja confirmar o agendamento?', 'bot', [
        {
          text: '✅ Confirmar agendamento',
          value: 'confirmar',
          action: () => handleConfirmation()
        },
        {
          text: '❌ Cancelar',
          value: 'cancelar',
          action: () => {
            addMessage('Agendamento cancelado.', 'bot');
            clearAllData();
          }
        }
      ]);

      setStep('confirmation');
    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao processar a seleção do pagamento.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Você precisa estar logado para agendar uma vacinação.', 'bot');
        navigate('/login');
        return;
      }

      // Validar todos os dados necessários
      const validationErrors = [];
      if (!selectedUnit) validationErrors.push('unidade');
      if (!selectedDate) validationErrors.push('data');
      if (!selectedTime) validationErrors.push('horário');
      if (!selectedPaymentMethod) validationErrors.push('forma de pagamento');

      if (validationErrors.length > 0) {
        addMessage(`❌ Por favor, selecione: ${validationErrors.join(', ')}.`, 'bot');
        return;
      }

      // Validar vacinas
      const vacinasIds = selectedMode === 'quote' ? 
        selectedQuote?.vacinas : 
        selectedVaccines.map(v => v.vaccineId);

      if (!vacinasIds || vacinasIds.length === 0) {
        addMessage('❌ Nenhuma vacina selecionada.', 'bot');
        return;
      }

      // Calcular valor total
      const valorTotal = selectedMode === 'quote' ? 
        Number(selectedQuote?.total || 0) : 
        selectedVaccines.reduce((acc, v) => acc + v.price, 0);

      // Criar o agendamento
      const agendamentoData = {
        user_id: user.id,
        unidade_id: Number(selectedUnit),
        forma_pagamento_id: Number(selectedPaymentMethod),
        valor_total: valorTotal,
        horario: selectedTime,
        dia: selectedDate,
        status_id: 1, // Pendente
        vacinas_id: vacinasIds
      };

      console.log('Dados do agendamento:', agendamentoData);

      // Verificar disponibilidade
      const { data: disponibilidade, error: errorDisponibilidade } = await supabase
        .rpc('verificar_disponibilidade_agendamento', {
          p_unidade_id: agendamentoData.unidade_id,
          p_dia: agendamentoData.dia,
          p_horario: agendamentoData.horario,
          p_qtd_vacinas_novas: vacinasIds.length // Número de vacinas sendo agendadas
        });

      if (errorDisponibilidade) {
        console.error('Erro ao verificar disponibilidade:', errorDisponibilidade);
        addMessage('❌ Erro ao verificar disponibilidade do horário.', 'bot');
        return;
      }

      if (!disponibilidade) {
        addMessage('❌ Este horário não está mais disponível.', 'bot');
        addMessage('Por favor, selecione outro horário ou data.', 'bot');
        
        // Mostrar detalhes da indisponibilidade
        const { data: detalhes } = await supabase
          .from('unit_schedules')
          .select('qtd_agendamentos')
          .eq('unit_id', agendamentoData.unidade_id)
          .eq('dia_da_semana', diasSemana[new Date(agendamentoData.dia).getDay()].split(' ')[0])
          .eq('horario_inicio', agendamentoData.horario)
          .single();

        if (detalhes) {
          addMessage(`ℹ️ Este horário já atingiu o limite máximo de ${detalhes.qtd_agendamentos} agendamentos.`, 'bot');
        }
        
        return;
      }

      // Criar o agendamento
      const { error: errorAgendamento } = await supabase
        .from('agendamento')
        .insert(agendamentoData);

      if (errorAgendamento) {
        console.error('Erro ao criar agendamento:', errorAgendamento);
        addMessage('❌ Erro ao criar o agendamento.', 'bot');
        return;
      }

      // Se for um orçamento, deletar após o agendamento
      if (selectedMode === 'quote' && selectedQuote?.id) {
        await supabase
          .from('orcamentos')
          .delete()
          .eq('id', selectedQuote.id);
      }

      addMessage('✅ Agendamento realizado com sucesso!', 'bot');
      addMessage('Você será redirecionado para a página de agendamentos em alguns segundos...', 'bot');

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/appointments');
      }, 3000);

    } catch (error) {
      console.error('Erro:', error);
      addMessage('❌ Ocorreu um erro ao confirmar o agendamento.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  return isVisible ? (
    <div className="fixed right-4 bottom-4 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden border border-[#009688]/10">
      {/* Cabeçalho do Chat */}
      <div className="bg-[#009688] p-4 flex justify-between items-center sticky top-0 z-[9999]">
        <div className="flex items-center">
          <h2 className="text-white text-lg font-medium">Assistente Virtual</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:text-white/80 transition-colors p-1"
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            onClick={handleClose}
            className="text-white hover:text-white/80 transition-colors p-1"
            title="Fechar chat"
          >
            ×
          </button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 bg-white ${
          isMinimized ? 'h-0' : 'h-full'
        }`}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'bot' ? 'justify-start' : 'justify-end'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.type === 'bot'
                  ? 'bg-gray-50 text-gray-800 shadow-sm'
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
            <div className="bg-gray-50 rounded-2xl p-4 shadow-sm">
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
  ) : (
    <button
      onClick={() => {
        clearAllData();
        setIsVisible(true);
      }}
      className="fixed right-4 bottom-4 bg-[#009688] text-white w-12 h-12 rounded-full shadow-xl hover:bg-[#00796B] transition-all hover:scale-110 active:scale-95 z-50 flex items-center justify-center"
      title="Abrir chat"
    >
      💬
    </button>
  );
};

export default VaccineChatbot; 