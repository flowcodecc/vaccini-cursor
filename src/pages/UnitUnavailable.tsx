
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

const UnitUnavailable = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div 
        className="max-w-4xl mx-auto opacity-100"
      >
        <div className="flex flex-col items-center mb-8">
          <img 
              src="logo.png" 
             alt="Vaccini Logo" 
            className="h-20 mb-4"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-3">Unidade não disponível no app</h1>
          <p className="text-gray-600 mb-6">
            Esta unidade ainda não está disponível para agendamento pelo aplicativo.
            Por favor, entre em contato por telefone para agendar nesta unidade.
          </p>

          <button 
            onClick={() => navigate(-1)}
            className="btn-primary flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitUnavailable;
