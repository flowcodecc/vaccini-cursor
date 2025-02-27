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
}

interface TimeSlot {
  id: string;
  horario_inicio: string;
  horario_fim: string;
}

const Schedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showQuoteSelection, setShowQuoteSelection] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [selectedVaccines, setSelectedVaccines] = useState<{ vaccineId: string; name: string; price: number }[]>([]);

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

  // Carregar orçamentos do usuário logado
  useEffect(() => {
    const loadQuotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast.error("Erro ao carregar orçamentos");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Você precisa criar um orçamento primeiro");
        navigate('/quote');
        return;
      }

      setQuotes(data);
    };

    loadQuotes();
  }, []);

  // Buscar horários disponíveis quando selecionar unidade e data
  const fetchAvailableTimeSlots = async (unit_id: number, dayOfWeek: string) => {
    try {
      const { data: schedules, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)
        .eq('dia_da_semana', dayOfWeek);

      if (error) throw error;

      if (!schedules || schedules.length === 0) {
        toast.error("Esta unidade não atende neste dia da semana");
        setAvailableTimeSlots([]);
        return;
      }

      setAvailableTimeSlots(schedules);
    } catch (err) {
      console.error(err);
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

  // Quando selecionar uma unidade, busca os dias que ela atende
  const fetchUnitSchedules = async (unitId: number) => {
    const { data: schedules, error } = await supabase
      .from('unit_schedules')
      .select('*')
      .eq('unit_id', unitId);

    if (error) {
      toast.error("Erro ao carregar horários da unidade");
      return;
    }

    // Mapeia os dias da semana que a unidade atende
    const availableDays = schedules.map(s => s.dia_da_semana);
    return availableDays;
  };

  // Verifica se o dia está disponível para agendamento
  const isDayAvailable = (date: Date, availableDays: string[]) => {
    const diasSemana: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terca',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sabado'
    };

    const dayOfWeek = diasSemana[date.getDay()];
    return availableDays.includes(dayOfWeek);
  };

  // Quando mudar a unidade
  useEffect(() => {
    if (selectedUnit) {
      setSelectedDate(undefined);
      setSelectedTime("");
      fetchUnitSchedules(selectedUnit).then(days => {
        // Guarda os dias disponíveis no estado
        setAvailableDays(days || []);
      });
    }
  }, [selectedUnit]);

  // Quando selecionar uma data, busca os horários
  useEffect(() => {
    if (selectedUnit && selectedDate) {
      const diasSemana: Record<number, string> = {
        0: 'Domingo',
        1: 'Segunda',
        2: 'Terca',
        3: 'Quarta',
        4: 'Quinta',
        5: 'Sexta',
        6: 'Sabado'
      };

      const dayOfWeek = diasSemana[selectedDate.getDay()];
      fetchAvailableTimeSlots(selectedUnit, dayOfWeek);
    }
  }, [selectedUnit, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from('agendamento')
        .insert({
          user_id: user.id,
          unidade_id: selectedUnit,
          forma_pagamento_id: selectedPaymentMethod,
          valor_total: totalValue,
          horario: selectedTime,
          dia: selectedDate?.toISOString().split('T')[0],
          status_id: 1, // 1 = Pendente
          vacinas_id: selectedVaccines.map(v => v.vaccineId)
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
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        {quote.vaccines.map((vaccineId: string) => {
                          const vaccine = vaccineOptions.find(v => v.id === vaccineId);
                          return vaccine && (
                            <span
                              key={vaccineId}
                              className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm mr-2"
                            >
                              {vaccine.name}
                            </span>
                          );
                        })}
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
                      if (isDayAvailable(date, availableDays)) {
                        setSelectedDate(date);
                        setSelectedTime(""); // Reset horário quando mudar data
                      } else {
                        toast.error("Esta unidade não atende neste dia da semana");
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    required
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
                          <SelectItem key={slot.id} value={slot.horario_inicio}>
                            {slot.horario_inicio} - {slot.horario_fim}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botão de Submit */}
          {selectedQuote && selectedUnit && selectedDate && selectedTime && (
            <div className="flex justify-end">
              <button
                type="submit"
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
