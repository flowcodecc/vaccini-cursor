
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

// Usuários fake para demonstração
const fakeUsers = [
  { email: "admin@vaccini.com", password: "admin123", name: "Administrador" },
  { email: "usuario@example.com", password: "123456", name: "João Silva" },
  { email: "maria@exemplo.com", password: "maria123", name: "Maria Santos" }
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFakeAccounts, setShowFakeAccounts] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Verificar credenciais fake
    const user = fakeUsers.find(user => 
      user.email === email && user.password === password
    );
    
    setTimeout(() => {
      setIsLoading(false);
      
      if (user) {
        // Login bem-sucedido
        toast.success(`Bem-vindo(a), ${user.name}!`);
        navigate("/");
      } else {
        // Login falhou
        toast.error("Email ou senha inválidos. Tente novamente.");
      }
    }, 1000);
  };

  const loginAsFakeUser = (user: typeof fakeUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    
    // Submeter automaticamente após um breve delay
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/lovable-uploads/6bb7863c-28a4-4e24-bc14-c6b7ee65c219.png" 
            alt="Vaccini Logo" 
            className="h-16"
          />
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{" "}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover">
            criar uma nova conta
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10 w-full"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field pl-10 w-full"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-hover">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn-primary flex justify-center items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowFakeAccounts(!showFakeAccounts)}
              className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
            >
              {showFakeAccounts ? "Ocultar contas de demonstração" : "Mostrar contas de demonstração"}
            </button>
            
            {showFakeAccounts && (
              <div className="mt-3 border rounded-lg divide-y">
                <div className="p-3 text-sm font-medium text-center bg-gray-50">
                  Contas para teste
                </div>
                {fakeUsers.map((user, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => loginAsFakeUser(user)}
                        className="text-xs text-primary hover:text-primary-hover"
                      >
                        Usar esta conta
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                      <span>Email: {user.email}</span>
                      <span>Senha: {user.password}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
