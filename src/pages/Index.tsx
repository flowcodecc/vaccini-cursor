
import { Link } from "react-router-dom";
import { Settings, Users, Syringe, Calendar, MessageSquare, DollarSign, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const navItems = [
    { title: "Perfil", icon: <Settings className="w-6 h-6 text-primary" />, path: "/profile" },
    { title: "Meus Dependentes", icon: <Users className="w-6 h-6 text-primary" />, path: "/dependents" },
    { title: "Agendar Vacina", icon: <Syringe className="w-6 h-6 text-primary" />, path: "/schedule" },
    { title: "Meus Agendamentos", icon: <Calendar className="w-6 h-6 text-primary" />, path: "/appointments" },
    { title: "Contato Vaccini", icon: <MessageSquare className="w-6 h-6 text-primary" />, path: "/contact" },
    { title: "Orçar Vacinas", icon: <DollarSign className="w-6 h-6 text-primary" />, path: "/quote" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-12">
          <img 
            src="/lovable-uploads/84c25f3f-e01b-4634-a514-2303a607d95d.png" 
            alt="Vaccini Logo" 
            className="h-20 mb-8"
          />
          <h1 className="text-2xl font-semibold text-center mb-2">
            O que deseja fazer agora?
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {navItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link to={item.path}>
                <div className="nav-card group">
                  <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-center">{item.title}</span>
                </div>
              </Link>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: navItems.length * 0.1 }}
          >
            <button 
              className="nav-card w-full border border-gray-100 group"
              onClick={() => console.log("Logout clicked")}
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <LogOut className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Sair</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
