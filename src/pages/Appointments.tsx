import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Appointment {
  id: number;
  dia: string;
  horario: string;
  unidade_id: number;
  user_id: string;
  vacinas_id: number[];
  status_id: number;
  valor_total: number;
  // Campos da view
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  // Campos relacionados
  unidade: { nome: string; }[];
  status: { nome: string; }[];
  vacinas: { nome: string; }[];
}

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Buscar agendamentos do funcionário
  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('vw_agendamentos_com_endereco')
        .select('*')
        .order('dia', { ascending: true });

      if (error) {
        toast.error("Erro ao carregar agendamentos");
        return;
      }

      // Buscar dados relacionados
      const appointmentsWithData = await Promise.all(data.map(async (appointment) => {
        const [unidadeData, statusData, vacinasData] = await Promise.all([
          supabase.from('unidade').select('nome').eq('id', appointment.unidade_id).single(),
          supabase.from('ref_status_agendamento').select('nome').eq('ref_status_agendamento_id (PK)', appointment.status_id).single(),
          supabase.from('ref_vacinas').select('nome').in('ref_vacinasID', appointment.vacinas_id)
        ]);

        return {
          ...appointment,
          unidade: unidadeData.data ? [{ nome: unidadeData.data.nome }] : [],
          status: statusData.data ? [{ nome: statusData.data.nome }] : [],
          vacinas: vacinasData.data || []
        };
      }));

      setAppointments(appointmentsWithData);
    };

    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamento')
        .update({ status_id: 4 }) // 4 = Cancelado
        .eq('id', id);

      if (error) throw error;

      setAppointments(appointments.map(app => 
        app.id === parseInt(id) ? { ...app, status: [{ nome: "Cancelado" }] } : app
      ));
      
      toast.success("Agendamento cancelado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "confirmado": return "bg-green-100 text-green-800";
      case "concluído": return "bg-blue-100 text-blue-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Agendamentos</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Nenhum agendamento encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(appointment.status[0].nome)}`}>
                          {appointment.status[0].nome}
                        </span>
                        <h3 className="text-lg font-medium">
                          {new Date(appointment.dia).toLocaleDateString('pt-BR')} às {appointment.horario}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {appointment.unidade[0].nome}
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Paciente: {`${appointment.nome} ${appointment.sobrenome}`}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Vacinas: {appointment.vacinas.map(v => v.nome).join(", ")}
                        </p>
                      </div>
                    </div>
                    
                    {appointment.status[0].nome.toLowerCase() !== "cancelado" && 
                     appointment.status[0].nome.toLowerCase() !== "concluído" && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id.toString())}
                        className="mt-4 md:mt-0 btn-secondary flex items-center gap-2 text-sm text-red-500"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
