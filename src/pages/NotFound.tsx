
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="text-center">
        <img 
            src="public/logo.png" 
            alt="Vaccini Logo" 
          className="h-20 mx-auto mb-8"
        />
        
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Página não encontrada</h2>
        <p className="text-gray-600 mb-8">A página que você está procurando não existe ou foi removida.</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar para Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página anterior
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
