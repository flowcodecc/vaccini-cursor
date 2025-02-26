
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userType: "patient", // or "professional"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/84c25f3f-e01b-4634-a514-2303a607d95d.png"
            alt="Vaccini Logo" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold mb-2">Criar nova conta</h1>
          <p className="text-sm text-muted-foreground">
            Preencha seus dados para começar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome completo
            </label>
            <input
              type="text"
              id="name"
              className="input-field w-full"
              placeholder="Seu nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="input-field w-full"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="input-field w-full pr-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de usuário
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-3 rounded-lg border transition-colors ${
                  formData.userType === "patient"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, userType: "patient" })}
              >
                <span className="block text-sm font-medium">Paciente</span>
              </button>
              <button
                type="button"
                className={`p-3 rounded-lg border transition-colors ${
                  formData.userType === "professional"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, userType: "professional" })}
              >
                <span className="block text-sm font-medium">Profissional</span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Criar conta
          </button>

          <p className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
