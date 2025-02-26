
import { motion } from "framer-motion";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-2xl font-semibold mb-6">Meu Perfil</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {/* Implementação do perfil virá aqui */}
          <p>Perfil em desenvolvimento...</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
