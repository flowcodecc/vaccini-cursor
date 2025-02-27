import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface ProfileData {
  nome: string;
  email: string;
  sobrenome: string;
  logradouro: string;
  cidade: string;
  estado: string;
  numero: string;
  bairro: string;
  sexo: string;
  nascimento: string;
  celular: string;
  complemento: string;
  cep: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    email: '',
    sobrenome: '',
    logradouro: '',
    cidade: '',
    estado: '',
    numero: '',
    bairro: '',
    sexo: '',
    nascimento: '',
    celular: '',
    complemento: '',
    cep: ''
  });

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: userData, error } = await supabase
          .from('user')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfileData({
          nome: userData.nome || '',
          email: userData.email || '',
          sobrenome: userData.sobrenome || '',
          logradouro: userData.logradouro || '',
          cidade: userData.cidade || '',
          estado: userData.estado || '',
          numero: userData.numero || '',
          bairro: userData.bairro || '',
          sexo: userData.sexo || '',
          nascimento: userData.nascimento || '',
          celular: userData.celular || '',
          complemento: userData.complemento || '',
          cep: userData.cep || ''
        });
      } catch (error) {
        toast.error("Erro ao carregar dados do perfil");
        navigate('/login');
      }
    }

    loadUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('user')
        .update({
          nome: profileData.nome,
          sobrenome: profileData.sobrenome,
          logradouro: profileData.logradouro,
          cidade: profileData.cidade,
          estado: profileData.estado,
          numero: profileData.numero,
          bairro: profileData.bairro,
          sexo: profileData.sexo,
          nascimento: profileData.nascimento,
          celular: profileData.celular,
          complemento: profileData.complemento,
          cep: profileData.cep
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto opacity-100">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png" 
            alt="Vaccini Connect" 
            className="h-20 mb-4"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold">Painel do Paciente - Vaccini</h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
          >
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome e Sobrenome */}
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
                    className="input-field pl-10 w-full"
                    value={profileData.nome}
                    onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                    disabled={!isEditing}
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
                    className="input-field pl-10 w-full"
                    value={profileData.sobrenome}
                    onChange={(e) => setProfileData({ ...profileData, sobrenome: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Telefone e Data de Nascimento */}
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
                    className="input-field pl-10 w-full"
                    value={profileData.celular}
                    onChange={(e) => setProfileData({ ...profileData, celular: e.target.value })}
                    disabled={!isEditing}
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
                    className="input-field pl-10 w-full"
                    value={profileData.nascimento}
                    onChange={(e) => setProfileData({ ...profileData, nascimento: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Sexo */}
            <div>
              <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                className="input-field w-full"
                value={profileData.sexo}
                onChange={(e) => setProfileData({ ...profileData, sexo: e.target.value })}
                disabled={!isEditing}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            {/* Endereço */}
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
                  value={profileData.cep}
                  onChange={(e) => setProfileData({ ...profileData, cep: e.target.value })}
                  disabled={!isEditing}
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
                  value={profileData.logradouro}
                  onChange={(e) => setProfileData({ ...profileData, logradouro: e.target.value })}
                  disabled={!isEditing}
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
                    value={profileData.numero}
                    onChange={(e) => setProfileData({ ...profileData, numero: e.target.value })}
                    disabled={!isEditing}
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
                    value={profileData.complemento}
                    onChange={(e) => setProfileData({ ...profileData, complemento: e.target.value })}
                    disabled={!isEditing}
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
                    value={profileData.bairro}
                    onChange={(e) => setProfileData({ ...profileData, bairro: e.target.value })}
                    disabled={!isEditing}
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
                    value={profileData.cidade}
                    onChange={(e) => setProfileData({ ...profileData, cidade: e.target.value })}
                    disabled={!isEditing}
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
                  value={profileData.estado}
                  onChange={(e) => setProfileData({ ...profileData, estado: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  {/* ... outros estados ... */}
                  <option value="SP">São Paulo</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
