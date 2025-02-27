
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Calendar } from "lucide-react";

const ScheduleConfirmation = () => {
  const navigate = useNavigate();

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

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Check className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-3">Vacina agendada com sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Uma enfermeira entrará em contato em até 24h para confirmar os detalhes.
            Nos vemos lá 😉
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button 
              onClick={() => navigate("/")}
              className="btn-secondary"
            >
              Voltar para a Home
            </button>
            <button 
              onClick={() => navigate("/appointments")}
              className="btn-primary flex items-center justify-center gap-2"
            >
              Ver Meus Agendamentos
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConfirmation;
