
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const UnitUnavailable = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-semibold mb-6">Unidade não disponível no app</h1>
          <p className="mb-4">Esta unidade ainda não está disponível para agendamento pelo aplicativo.</p>
          <button 
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UnitUnavailable;
