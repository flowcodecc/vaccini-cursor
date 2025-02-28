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
  endereco: string;
  status: boolean;
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
  id: string;
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
  id: string;
  user_id: string;
  vaccines: string; // JSONB vem como string do banco
  total: number;
  created_at: string;
  nome_paciente: string;
}

// Constante global para os dias da semana
const diasSemana: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terca',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sabado'
};

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
  const [selectedVaccines, setSelectedVaccines] = useState<{ vaccineId: string; name: string; price: number }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Pegar as vacinas do orçamento
  const quoteVaccines = location.state?.vaccines || [];
  const quoteTotal = location.state?.total || 0;

  const vaccineOptions = [
    {
      id: "1",
      name: "Vacina contra Gripe",
      description: "Proteção contra os vírus da gripe sazonal",
      price: 90.00
    },
    {
      id: "2",
      name: "COVID-19",
      description: "Imunização contra o coronavírus",
      price: 120.00
    },
    {
      id: "3",
      name: "Hepatite B",
      description: "Prevenção contra a hepatite B",
      price: 150.00
    }
  ];

  const insuranceProviders: InsuranceProvider[] = [
    { id: "1", name: "Unimed" },
    { id: "2", name: "Bradesco Saúde" },
    { id: "3", name: "Amil" },
    { id: "4", name: "SulAmérica" },
    { id: "5", name: "NotreDame Intermédica" },
  ];

  // Ajustar a função que carrega os orçamentos
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Buscar orçamentos
        const { data: orcamentos, error } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar orçamentos:', error);
          toast.error("Erro ao carregar orçamentos");
          return;
        }

        // Para cada orçamento, buscar os nomes das vacinas
        const quotesWithVaccines = await Promise.all(orcamentos.map(async (orcamento) => {
          // Parse o campo vaccines que é JSONB
          const vaccines = JSON.parse(orcamento.vaccines);
          const vaccineIds = vaccines.map((v: any) => v.ref_vacinasID);
          
          const { data: vacinas } = await supabase
            .from('ref_vacinas')
            .select('ref_vacinasID, nome')
            .in('ref_vacinasID', vaccineIds);

          return {
            ...orcamento,
            vaccines: vaccines.map((vaccine: any) => ({
              id: vaccine.ref_vacinasID,
              nome: vacinas?.find(v => v.ref_vacinasID === vaccine.ref_vacinasID)?.nome
            }))
          };
        }));

        console.log('Orçamentos com vacinas:', quotesWithVaccines);
        setQuotes(quotesWithVaccines);

      } catch (error) {
        console.error('Erro:', error);
        toast.error("Erro ao carregar orçamentos");
      }
    };

    loadQuotes();
  }, []);

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

  // Carregar unidades quando selecionar um orçamento
  useEffect(() => {
    if (selectedQuote) {
      const fetchUnits = async () => {
        const { data, error } = await supabase
          .from('unidade')
          .select('*')
          .eq('status', true);

        if (error) {
          toast.error("Erro ao carregar unidades");
          return;
        }
        setUnits(data || []);
      };

      fetchUnits();
    }
  }, [selectedQuote]);

  // Carregar formas de pagamento
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('ref_formas_pagamentos')
          .select('*');

        console.log('Dados retornados:', data); // Debug

        if (error) throw error;

        if (!data || data.length === 0) {
          // Se não houver dados, usar valores padrão
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

          // Guardar os dias que a unidade atende
          const days = [...new Set(schedules.map(s => s.dia_da_semana))];
          console.log('Dias que a unidade atende:', days);
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

    if (!selectedQuote) {
      toast.error("Selecione um orçamento");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Usar os IDs das vacinas do orçamento
      const vaccines = JSON.parse(selectedQuote.vaccines).map((v: any) => v.ref_vacinasID);

      const { data, error } = await supabase
        .from('agendamento')
        .insert({
          user_id: user.id,
          unidade_id: selectedUnit,
          forma_pagamento_id: selectedPaymentMethod,
          valor_total: selectedQuote.total,
          horario: selectedTime,
          dia: selectedDate.toISOString().split('T')[0],
          status_id: 1,
          vaccines: vaccines // Array de IDs das vacinas
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Agendamento realizado com sucesso!");
      navigate('/appointments');

    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar agendamento");
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
          {/* Lista de Orçamentos */}
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
              {quotes.map((quote) => (
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
                      <p className="mt-1 font-medium">{quote.nome_paciente}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {JSON.parse(quote.vaccines).map((vaccine: any) => (
                          <span
                            key={vaccine.ref_vacinasID}
                            className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            {vaccine.ref_vacinasID === 7 ? "COVID-19" : vaccine.ref_vacinasID === 2 ? "Hepatite B" : "Vacina"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="font-medium">R$ {quote.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Unidade */}
          {selectedQuote && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Escolha a Unidade</h2>
              <div className="space-y-3">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer
                      ${selectedUnit === unit.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                  >
                    <input
                      type="radio"
                      name="unit"
                      value={unit.id}
                      checked={selectedUnit === unit.id}
                      onChange={(e) => setSelectedUnit(Number(e.target.value))}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="font-medium">{unit.nome}</h3>
                      <p className="text-sm text-gray-500">{unit.endereco}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Data e Hora */}
          {selectedUnit > 0 && (
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Forma de Pagamento</h2>
            <Select
              value={selectedPaymentMethod ? selectedPaymentMethod.toString() : ""}
              onValueChange={(value) => setSelectedPaymentMethod(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Botão de Agendar */}
          {selectedUnit && selectedDate && selectedTime && selectedPaymentMethod && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
              >
                Agendar Agora
                <ChevronRight className="w-4 h-4 ml-2 inline-block" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
