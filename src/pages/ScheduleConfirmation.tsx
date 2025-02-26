
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ScheduleConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-semibold mb-6">Vacina agendada com sucesso. Nos vemos lá 😉</h1>
          <p className="mb-4">Uma enfermeira entrará em contato em até 24h para confirmar os detalhes.</p>
          <button 
            onClick={() => navigate("/")}
            className="btn-primary"
          >
            Voltar para a Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleConfirmation;
