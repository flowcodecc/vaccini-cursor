import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, Calendar, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    sobrenome: "",
    celular: "",
    nascimento: "",
    logradouro: "",
    cidade: "",
    estado: "",
    numero: "",
    bairro: "",
    sexo: "",
    complemento: "",
    cep: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, cep: value }));

    // Busca CEP quando atinge 8 dígitos
    if (value.replace(/\D/g, '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      // Tradução dos erros do Supabase
      if (authError) {
        switch (authError.message) {
          case "User already registered":
            throw new Error("Este email já está cadastrado");
          case "Password should be at least 6 characters":
            throw new Error("A senha deve ter pelo menos 6 caracteres");
          case "Email not confirmed":
            throw new Error("Email não confirmado. Verifique sua caixa de entrada");
          default:
            throw new Error("Erro ao criar conta. Tente novamente");
        }
      }

      if (!user) throw new Error("Erro ao criar usuário");

      // 2. Inserir dados na tabela public.user
      const { error: userError } = await supabase
        .from('user')
        .insert([
          {
            id: user.id,
            nome: formData.nome,
            email: formData.email,
            celular: formData.celular,
            nascimento: formData.nascimento,
            is_active: true,
            status: true
          }
        ]);

      if (userError) throw userError;

      toast.success("Conta criada com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/logo.png" 
            alt="Vaccini Logo" 
            className="h-16"
          />
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
            acesse sua conta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    className="input-field pl-10 w-full"
                    placeholder="Seu nome"
                    value={formData.nome}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sobrenome" className="block text-sm font-medium text-gray-700">
                  Sobrenome
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="sobrenome"
                    name="sobrenome"
                    type="text"
                    required
                    className="input-field pl-10 w-full"
                    placeholder="Seu sobrenome"
                    value={formData.sobrenome}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="celular" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="celular"
                    name="celular"
                    type="tel"
                    required
                    className="input-field pl-10 w-full"
                    placeholder="(00) 00000-0000"
                    value={formData.celular}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nascimento" className="block text-sm font-medium text-gray-700">
                  Data de Nascimento
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nascimento"
                    name="nascimento"
                    type="date"
                    required
                    className="input-field pl-10 w-full"
                    value={formData.nascimento}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                required
                className="input-field w-full"
                value={formData.sexo}
                onChange={handleChange}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  id="cep"
                  name="cep"
                  type="text"
                  className="input-field w-full"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleCepChange}
                />
              </div>

              <div>
                <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700">
                  Logradouro
                </label>
                <input
                  id="logradouro"
                  name="logradouro"
                  type="text"
                  className="input-field w-full"
                  value={formData.logradouro}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
                    Número
                  </label>
                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    className="input-field w-full"
                    value={formData.numero}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">
                    Complemento
                  </label>
                  <input
                    id="complemento"
                    name="complemento"
                    type="text"
                    className="input-field w-full"
                    value={formData.complemento}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">
                    Bairro
                  </label>
                  <input
                    id="bairro"
                    name="bairro"
                    type="text"
                    className="input-field w-full"
                    value={formData.bairro}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
                    Cidade
                  </label>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    className="input-field w-full"
                    value={formData.cidade}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  className="input-field w-full"
                  value={formData.estado}
                  onChange={handleChange}
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
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
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10 w-full"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10 w-full"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full btn-primary flex justify-center items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar Conta"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
