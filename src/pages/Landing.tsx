import { Link } from "react-router-dom";
import { MessageSquare, Users, Shield, Clock } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#009688] to-[#00796B]">
      {/* Header */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Vaccini Logo" 
              className="h-10"
            />
            <span className="text-white text-2xl font-bold">Vaccini</span>
          </div>
          <div className="space-x-4">
            <Link 
              to="/login" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              Entrar
            </Link>
            <Link 
              to="/register" 
              className="bg-white text-[#009688] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Cuide da sua saúde com praticidade
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Encontre a unidade Vaccini mais próxima de você e tenha acesso a informações sobre vacinas e agendamentos.
            </p>
            <div className="space-y-4">
              <Link 
                to="/chat" 
                className="inline-flex items-center bg-white text-[#009688] px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
              >
                <MessageSquare className="w-6 h-6 mr-3" />
                Conversar com Assistente Virtual
              </Link>
              <div className="text-white/80 text-sm">
                ✓ Sem necessidade de cadastro<br/>
                ✓ Encontre unidades próximas<br/>
                ✓ Informações de contato
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-white text-2xl font-semibold mb-6">Como funciona?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Informe seus dados</h4>
                    <p className="text-white/80 text-sm">Nome, email, telefone e CEP</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Encontre unidades</h4>
                    <p className="text-white/80 text-sm">Verificamos quais atendem sua região</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Receba informações</h4>
                    <p className="text-white/80 text-sm">Telefone, endereço e horários</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Por que escolher a Vaccini?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos referência em imunização com unidades estrategicamente localizadas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-[#009688]/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#009688]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Segurança</h3>
              <p className="text-gray-600">
                Vacinas de qualidade com protocolos rigorosos de segurança
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#009688]/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#009688]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Especialistas</h3>
              <p className="text-gray-600">
                Equipe especializada em imunização para toda a família
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-[#009688]/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#009688]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Praticidade</h3>
              <p className="text-gray-600">
                Horários flexíveis e atendimento ágil em diversas unidades
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#009688] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para cuidar da sua saúde?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Use nosso assistente virtual para encontrar a unidade mais próxima
          </p>
          <Link 
            to="/chat" 
            className="inline-flex items-center bg-white text-[#009688] px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            <MessageSquare className="w-6 h-6 mr-3" />
            Iniciar Conversa
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/logo.png" 
              alt="Vaccini Logo" 
              className="h-8"
            />
            <span className="text-xl font-bold">Vaccini</span>
          </div>
          <p className="text-gray-400">
            © 2024 Vaccini. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
