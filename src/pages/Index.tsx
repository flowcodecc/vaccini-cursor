
import { Link, useNavigate } from "react-router-dom";
import { Settings, Users, Syringe, Calendar, MessageSquare, DollarSign, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  const navItems = [
    { title: "Perfil", icon: <Settings className="w-6 h-6 text-primary" />, path: "/profile" },
    { title: "Meus Dependentes", icon: <Users className="w-6 h-6 text-primary" />, path: "/dependents" },
    { title: "Agendar Vacina", icon: <Syringe className="w-6 h-6 text-primary" />, path: "/schedule" },
    { title: "Meus Agendamentos", icon: <Calendar className="w-6 h-6 text-primary" />, path: "/appointments" },
    { title: "Contato Vaccini", icon: <MessageSquare className="w-6 h-6 text-primary" />, path: "/contact" },
    { title: "Orçar Vacinas", icon: <DollarSign className="w-6 h-6 text-primary" />, path: "/quote" },
  ];

  const handleLogout = () => {
    console.log("Logout clicked");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-12">
          <img 
            src="public/logo.png" 
            alt="Vaccini Logo" 
            className="h-20 mb-8"
          />
          <h1 className="text-2xl font-semibold text-center mb-2">
            O que deseja fazer agora?
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {navItems.map((item, index) => (
            <div
              key={item.title}
            >
              <Link to={item.path}>
                <div className="nav-card group">
                  <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-center">{item.title}</span>
                </div>
              </Link>
            </div>
          ))}
          
          <div>
            <button 
              className="nav-card w-full border border-gray-100 group"
              onClick={handleLogout}
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                <LogOut className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
