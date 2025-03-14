import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, Upload } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface InsuranceProvider {
  id: string;
  name: string;
}

interface Unit {
  id: number;
  nome: string;
  status: boolean;
  atende_aplicativo: boolean;
}

interface Vaccine {
  ref_vacinasID: number;
  nome: string;
  preco: number;
  status: boolean;
  vacinas_plano: number[];
  esquema_id: number;
}

interface UnitSchedule {
  id: number;
  unit_id: number;
  dia_da_semana: string;
  horario_inicio: string;
  horario_fim: string;
  qtd_agendamentos: number | null;
}

interface TimeSlot {
  id: number;
  horario_inicio: string;
  horario_fim: string;
}

interface PaymentMethod {
  id: number;
  nome: string;
}

// Ajustar a interface de Status
interface AppointmentStatus {
  ref_status_agendamento_id: number;
  nome: string;
}

// Ajustar a interface Quote
interface Quote {
  id: number;
  created_at: string;
  total: number;
  has_insurance: boolean;
  nomes_vacinas: string[];
  vacinas: number[];
}

// Constante global para os dias da semana
const diasSemana = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const Schedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteSelection, setShowQuoteSelection] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedVaccines, setSelectedVaccines] = useState<{ vaccineId: number; name: string; price: number }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [schedulingMode, setSchedulingMode] = useState<'quote' | 'direct'>('quote');
  const [vaccineOptions, setVaccineOptions] = useState<Vaccine[]>([]);
  const [unidadesPermitidas, setUnidadesPermitidas] = useState<number[]>([]);

  // Pegar as vacinas do orçamento
  const quoteVaccines = location.state?.vaccines || [];
  const quoteTotal = location.state?.total || 0;

  const insuranceProviders: InsuranceProvider[] = [
    { id: "1", name: "Unimed" },
    { id: "2", name: "Bradesco Saúde" },
    { id: "3", name: "Amil" },
    { id: "4", name: "SulAmérica" },
    { id: "5", name: "NotreDame Intermédica" },
  ];

  // Carregar unidades quando selecionar um orçamento
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Primeiro, obter as unidades que atendem o CEP do usuário
        const { data: unidadesCEP, error: errorPermitidas } = await supabase
          .rpc('verifica_unidade_usuario', {
            user_id: user.id
          });

        if (errorPermitidas) {
          console.error('Erro ao verificar unidades permitidas:', errorPermitidas);
          toast.error("Erro ao carregar unidades");
          return;
        }

        // Guardar os IDs das unidades que atendem o CEP
        const idsUnidadesPermitidas = unidadesCEP?.map(u => u.unidade_id) || [];
        setUnidadesPermitidas(idsUnidadesPermitidas);
        console.log('Unidades que atendem o CEP:', unidadesCEP);

        // Buscar todas as unidades
        const { data: todasUnidades, error: errorUnidades } = await supabase
          .from('unidade')
          .select('id, nome, status, atende_aplicativo')
          .eq('status', true);

        if (errorUnidades) {
          console.error('Erro ao carregar dados das unidades:', errorUnidades);
          toast.error("Erro ao carregar dados das unidades");
          return;
        }

        console.log('Todas as unidades:', todasUnidades);
        setUnits(todasUnidades || []);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        toast.error("Erro ao carregar unidades");
      }
    };

    fetchUnits();
  }, [navigate]);

  // Carregar orçamentos quando a página carregar
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: orcamentos, error } = await supabase
          .from('view_orcamentos_com_vacinas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar orçamentos:', error);
          toast.error("Erro ao carregar orçamentos");
          return;
        }

        setQuotes(orcamentos || []);
      } catch (error) {
        console.error('Erro:', error);
        toast.error("Erro ao carregar orçamentos");
      }
    };

    loadQuotes();
  }, [navigate]);

  // Carregar formas de pagamento
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('ref_formas_pagamentos')
          .select('*');

        if (error) {
          console.error('Erro ao carregar formas de pagamento:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          setPaymentMethods([
            { id: 1, nome: 'Cartão de Crédito' },
            { id: 2, nome: 'Cartão de Débito' },
            { id: 3, nome: 'PIX' }
          ]);
        } else {
          setPaymentMethods(data);
        }
      } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        toast.error("Erro ao carregar formas de pagamento");
      }
    };

    fetchPaymentMethods();
  }, []);

  // Carregar vacinas disponíveis
  useEffect(() => {
    const fetchVaccines = async () => {
      try {
        const { data, error } = await supabase
          .from('ref_vacinas')
          .select('ref_vacinasID, nome, preco, status, vacinas_plano, esquema_id')
          .eq('status', true);

        if (error) {
          console.error('Erro ao carregar vacinas:', error);
          toast.error("Erro ao carregar vacinas");
          return;
        }

        setVaccineOptions(data || []);
      } catch (error) {
        console.error('Erro ao carregar vacinas:', error);
        toast.error("Erro ao carregar vacinas");
      }
    };

    fetchVaccines();
  }, []);

  // Quando mudar a unidade, buscar os dias disponíveis
  useEffect(() => {
    if (selectedUnit) {
      const fetchUnitDays = async () => {
        try {
          const { data: schedules, error } = await supabase
            .from('unit_schedules')
            .select('dia_da_semana')
            .eq('unit_id', selectedUnit);

          if (error) {
            toast.error("Erro ao carregar dias disponíveis");
            return;
          }

          const days = [...new Set(schedules.map(s => s.dia_da_semana))];
          setAvailableDays(days);
        } catch (error) {
          console.error('Erro:', error);
          toast.error("Erro ao carregar dias disponíveis");
        }
      };

      fetchUnitDays();
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [selectedUnit]);

  // Quando selecionar uma data, busca os horários
  useEffect(() => {
    if (selectedUnit && selectedDate) {
      fetchAvailableTimeSlots(selectedUnit, selectedDate);
    }
  }, [selectedUnit, selectedDate]);

  // Buscar horários disponíveis quando selecionar unidade e data
  const fetchAvailableTimeSlots = async (unit_id: number, date: Date) => {
    try {
      const dayOfWeek = diasSemana[date.getDay()];
      console.log('Buscando horários para:', { unit_id, dayOfWeek });

      const { data: schedules, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)
        .ilike('dia_da_semana', dayOfWeek);

      console.log('Horários encontrados:', schedules);

      if (error) {
        console.error('Erro na busca:', error);
        throw error;
      }

      if (!schedules || schedules.length === 0) {
        toast.error(`Esta unidade não atende às ${dayOfWeek}s`);
        setAvailableTimeSlots([]);
        return;
      }

      // Mapear os horários para o formato correto
      const timeSlots = schedules.map(slot => ({
        id: slot.id,
        horario_inicio: slot.horario_inicio,
        horario_fim: slot.horario_fim
      }));

      setAvailableTimeSlots(timeSlots);

    } catch (err) {
      console.error('Erro completo:', err);
      toast.error("Erro ao carregar horários");
      setAvailableTimeSlots([]);
    }
  };

  // Ajustar a função isDayAvailable
  const isDayAvailable = (date: Date) => {
    const dayOfWeek = diasSemana[date.getDay()];
    console.log({
      dayToCheck: dayOfWeek,
      availableDays,
      isAvailable: availableDays.some(day => day.toLowerCase() === dayOfWeek.toLowerCase())
    });
    
    return availableDays.some(day => day.toLowerCase() === dayOfWeek.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (schedulingMode === 'quote' && !selectedQuote) {
      toast.error("Selecione um orçamento");
      return;
    }

    if (schedulingMode === 'direct' && selectedVaccines.length === 0) {
      toast.error("Selecione pelo menos uma vacina");
      return;
    }

    if (!selectedUnit) {
      toast.error("Selecione uma unidade");
      return;
    }

    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    if (!selectedTime) {
      toast.error("Selecione um horário");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Verificar agendamento existente
      const { data: existingAppointment } = await supabase
        .from('agendamento')
        .select('id')
        .eq('user_id', user.id)
        .eq('dia', selectedDate.toISOString().split('T')[0])
        .single();

      if (existingAppointment) {
        toast.error("Você já possui um agendamento para esta data");
        return;
      }

      // Verificar horário disponível
      const { data: conflictingAppointment } = await supabase
        .from('agendamento')
        .select('id')
        .eq('unidade_id', selectedUnit)
        .eq('dia', selectedDate.toISOString().split('T')[0])
        .eq('horario', selectedTime)
        .single();

      if (conflictingAppointment) {
        toast.error("Este horário já está ocupado");
        return;
      }

      // Preparar dados do agendamento
      const agendamentoData = {
        user_id: user.id,
        unidade_id: selectedUnit,
        forma_pagamento_id: selectedPaymentMethod,
        valor_total: schedulingMode === 'quote' ? Number(selectedQuote?.total) : selectedVaccines.reduce((acc, v) => acc + v.price, 0),
        horario: selectedTime,
        dia: selectedDate.toISOString().split('T')[0],
        status_id: 1,
        vacinas_id: schedulingMode === 'quote' ? selectedQuote?.vacinas : selectedVaccines.map(v => Number(v.vaccineId))
      };

      // Criar o agendamento
      const { data, error } = await supabase
        .from('agendamento')
        .insert(agendamentoData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        throw error;
      }

      // Excluir o orçamento apenas se estiver usando modo orçamento
      if (schedulingMode === 'quote' && selectedQuote) {
        const { error: deleteError } = await supabase
          .from('orcamentos')
          .delete()
          .eq('id', selectedQuote.id);

        if (deleteError) {
          console.error('Erro ao excluir orçamento:', deleteError);
          toast.error("Agendamento criado, mas houve um erro ao excluir o orçamento");
        }
      }

      toast.success("Agendamento realizado com sucesso!");
      navigate('/appointments');

    } catch (err: any) {
      console.error('Erro completo:', err);
      if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao realizar agendamento. Por favor, tente novamente.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Agendar Vacina</h1>
        </div>

        <div className="space-y-6">
          {/* Seleção do Modo de Agendamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Escolha o Modo de Agendamento</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSchedulingMode('quote')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  schedulingMode === 'quote' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                }`}
              >
                <h3 className="font-medium">Usar Orçamento</h3>
                <p className="text-sm text-gray-500">Agendar usando um orçamento existente</p>
              </button>
              <button
                onClick={() => setSchedulingMode('direct')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  schedulingMode === 'direct' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                }`}
              >
                <h3 className="font-medium">Agendamento Direto</h3>
                <p className="text-sm text-gray-500">Escolher vacinas diretamente</p>
              </button>
            </div>
          </div>

          {/* Lista de Orçamentos ou Seleção de Vacinas */}
          {schedulingMode === 'quote' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Selecione um Orçamento</h2>
                <button
                  onClick={() => navigate('/quote')}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                >
                  Criar Novo Orçamento
                </button>
              </div>

              <div className="space-y-4">
                {quotes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Você ainda não possui nenhum orçamento</p>
                    <button
                      onClick={() => navigate('/quote')}
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 inline-flex items-center gap-2"
                    >
                      Criar Primeiro Orçamento
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  quotes.map((quote) => (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuote(quote)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors
                        ${selectedQuote?.id === quote.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(quote.created_at).toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {quote.has_insurance && (
                              <span className="text-sm text-green-500">Com desconto do plano</span>
                            )}
                            {quote.nomes_vacinas && quote.nomes_vacinas.map((nome: string, index: number) => (
                              <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {nome}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg text-primary">R$ {Number(quote.total).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Total</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Selecione as Vacinas</h2>
              <div className="space-y-4">
                {vaccineOptions.map((vaccine) => (
                  <label
                    key={vaccine.ref_vacinasID}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer
                      ${selectedVaccines.some(v => v.vaccineId === vaccine.ref_vacinasID) ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVaccines.some(v => v.vaccineId === vaccine.ref_vacinasID)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVaccines([...selectedVaccines, { 
                            vaccineId: vaccine.ref_vacinasID, 
                            name: vaccine.nome, 
                            price: vaccine.preco 
                          }]);
                        } else {
                          setSelectedVaccines(selectedVaccines.filter(v => v.vaccineId !== vaccine.ref_vacinasID));
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="font-medium">{vaccine.nome}</h3>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Seleção de Unidade */}
          {(selectedQuote || (schedulingMode === 'direct' && selectedVaccines.length > 0)) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Escolha a Unidade</h2>
            <div className="space-y-3">
              {units.map((unit) => {
                const atendeCEP = unidadesPermitidas.includes(unit.id);
                return (
                  <label
                    key={unit.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer relative
                      ${!atendeCEP ? 'opacity-75' : ''}
                      ${selectedUnit === unit.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                  >
                    <input
                      type="radio"
                      name="unit"
                      value={unit.id}
                      checked={selectedUnit === unit.id}
                      onChange={(e) => {
                        const unitId = Number(e.target.value);
                        if (!atendeCEP) {
                          toast.error("Esta unidade não atende seu CEP");
                          return;
                        }
                        if (!unit.atende_aplicativo) {
                          navigate('/unit-unavailable');
                          return;
                        }
                        setSelectedUnit(unitId);
                      }}
                      className="mt-1"
                      disabled={!atendeCEP}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{unit.nome}</h3>
                      {!atendeCEP && (
                        <span className="text-sm text-red-500">
                          Esta unidade não atende seu CEP
                        </span>
                      )}
                      {!unit.atende_aplicativo && (
                        <span className="text-sm text-orange-500 block">
                          Esta unidade não atende pelo aplicativo
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          )}

          {/* Data e Hora */}
          {((selectedQuote || (schedulingMode === 'direct' && selectedVaccines.length > 0)) && selectedUnit > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Escolha a Data e Hora</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Data</Label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg"
                    value={selectedDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (isDayAvailable(date)) {
                        setSelectedDate(date);
                        fetchAvailableTimeSlots(selectedUnit, date);
                      } else {
                        toast.error(`Esta unidade não atende às ${diasSemana[date.getDay()]}s`);
                        setSelectedDate(undefined);
                        setAvailableTimeSlots([]);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {selectedDate && availableTimeSlots.length > 0 && (
                  <div>
                    <Label>Horário</Label>
                    <Select
                      value={selectedTime}
                      onValueChange={setSelectedTime}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableTimeSlots.map((slot) => (
                          <SelectItem 
                            key={slot.id} 
                            value={slot.horario_inicio}
                          >
                            {`${slot.horario_inicio} - ${slot.horario_fim}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forma de Pagamento */}
          {((selectedQuote || (schedulingMode === 'direct' && selectedVaccines.length > 0)) && selectedUnit > 0 && selectedDate && selectedTime) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Forma de Pagamento</h2>
            <Select
              value={selectedPaymentMethod ? selectedPaymentMethod.toString() : ""}
              onValueChange={(value) => setSelectedPaymentMethod(Number(value))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {paymentMethods.map((method) => (
                  <SelectItem 
                    key={method.id} 
                    value={method.id.toString()}
                  >
                    {method.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}

          {/* Resumo do Agendamento */}
          {((selectedQuote || (schedulingMode === 'direct' && selectedVaccines.length > 0)) && selectedUnit > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Resumo do Agendamento</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Vacinas Selecionadas:</h3>
                  <div className="space-y-2">
                    {schedulingMode === 'quote' ? (
                      <>
                        {selectedQuote?.nomes_vacinas.map((nome, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span>{nome}</span>
                            <span className="text-primary">R$ {Number(selectedQuote?.total / selectedQuote?.nomes_vacinas.length).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total:</span>
                            <span className="text-lg font-semibold text-primary">
                              R$ {Number(selectedQuote?.total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedVaccines.map((vaccine) => (
                          <span key={vaccine.vaccineId} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {vaccine.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Agendar */}
          {((schedulingMode === 'quote' && selectedQuote) || (schedulingMode === 'direct' && selectedVaccines.length > 0)) && selectedUnit > 0 && selectedDate && selectedTime && selectedPaymentMethod && (
          <div className="flex justify-end">
            <button
                onClick={handleSubmit}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 flex items-center"
            >
              Agendar Agora
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
