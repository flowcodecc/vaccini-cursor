
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Appointment {
  id: string;
  date: string;
  time: string;
  unit: string;
  vaccines: string[];
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      date: "2023-06-15",
      time: "14:00",
      unit: "Unidade Centro",
      vaccines: ["Vacina contra Gripe", "COVID-19"],
      status: "confirmed"
    },
    {
      id: "2",
      date: "2023-07-20",
      time: "10:00",
      unit: "Unidade Norte",
      vaccines: ["Hepatite B"],
      status: "pending"
    }
  ]);

  const handleCancelAppointment = (id: string) => {
    setAppointments(appointments.map(app => 
      app.id === id ? { ...app, status: "cancelled" as const } : app
    ));
    toast.success("Agendamento cancelado com sucesso!");
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch(status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "";
    }
  };

  const getStatusText = (status: Appointment["status"]) => {
    switch(status) {
      case "pending": return "Pendente";
      case "confirmed": return "Confirmado";
      case "completed": return "Concluído";
      case "cancelled": return "Cancelado";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div 
        className="max-w-4xl mx-auto opacity-100"
      >
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/lovable-uploads/6bb7863c-28a4-4e24-bc14-c6b7ee65c219.png" 
            alt="Vaccini Logo" 
            className="h-20 mb-4"
          />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Meus Agendamentos</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Você ainda não possui agendamentos.
              </p>
              <button
                onClick={() => navigate("/schedule")}
                className="btn-primary mt-4 flex items-center gap-2 mx-auto"
              >
                Agendar Agora
                <ChevronRight className="w-4 h-4" />
              </button>
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
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                        <h3 className="text-lg font-medium">
                          {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {appointment.unit}
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appointment.vaccines.join(", ")}
                        </p>
                      </div>
                    </div>
                    
                    {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="mt-4 md:mt-0 btn-secondary flex items-center gap-2 text-sm text-red-500"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => navigate("/schedule")}
                  className="btn-primary flex items-center gap-2"
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
