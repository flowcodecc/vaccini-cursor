import { useState, useEffect } from "react";
import { ArrowLeft, Syringe, MapPin, Clock, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Appointment {
  id: number;
  created_at: string;
  user_id: string;
  unidade_id: number;
  forma_pagamento_id: number;
  valor_total: number;
  horario: string;
  dia: string;
  status_id: number;
  vacinas_id: number[];
  nomes_vacinas: string[];
  status_nome: string;
  forma_pagamento_nome: string;
  unidade: {
    nome: string;
  };
}

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Buscar agendamentos do funcionário
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        console.log('User ID:', user.id);

        const { data, error } = await supabase
          .from('view_agendamentos_com_vacinas_status_pagamento')
          .select(`
            *,
            unidade:unidade_id(nome)
          `)
          .eq('user_id', user.id)
          .order('dia', { ascending: true });

        console.log('Query result:', { data, error });

        if (error) {
          console.error('Erro ao buscar agendamentos:', error);
          toast.error("Erro ao carregar agendamentos");
          return;
        }

        setAppointments(data || []);
      } catch (error) {
        console.error('Erro:', error);
        toast.error("Erro ao carregar agendamentos");
      }
    };

    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamento')
        .update({ status_id: 3 }) // Status "Cancelado"
        .eq('id', id);

      if (error) throw error;

      setAppointments(appointments.map(app => 
        app.id === parseInt(id) ? { ...app, status_nome: "Cancelado" } : app
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
                  className={`rounded-lg p-4 transition-all
                    ${appointment.status_nome.toLowerCase() === "confirmado" ? "bg-emerald-50" : ""}
                    ${appointment.status_nome.toLowerCase() === "pendente" ? "bg-amber-50" : ""}
                    ${appointment.status_nome.toLowerCase() === "cancelado" ? "bg-rose-50" : ""}
                    ${appointment.status_nome.toLowerCase() === "concluído" ? "bg-sky-50" : ""}
                  `}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-sm font-medium rounded
                        ${appointment.status_nome.toLowerCase() === "confirmado" ? "bg-emerald-100" : ""}
                        ${appointment.status_nome.toLowerCase() === "pendente" ? "bg-amber-100" : ""}
                        ${appointment.status_nome.toLowerCase() === "cancelado" ? "bg-rose-100" : ""}
                        ${appointment.status_nome.toLowerCase() === "concluído" ? "bg-sky-100" : ""}
                      `}>
                        {appointment.status_nome}
                      </span>
                      <span className="text-lg">
                        {new Date(appointment.dia).toLocaleDateString('pt-BR')} às {appointment.horario}
                      </span>
                      {appointment.status_nome.toLowerCase() !== "cancelado" && 
                       appointment.status_nome.toLowerCase() !== "concluído" && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id.toString())}
                          className="ml-auto text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Unidade {appointment.unidade.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Syringe className="w-4 h-4" />
                        <span>{appointment.nomes_vacinas.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => navigate('/schedule')}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  Agendar Nova Vacina
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
