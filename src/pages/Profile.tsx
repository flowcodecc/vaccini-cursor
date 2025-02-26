
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  cpf: string;
  birthDate: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123 - São Paulo, SP",
    cpf: "123.456.789-00",
    birthDate: "1990-01-01"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar integração com backend
    toast.success("Perfil atualizado com sucesso!");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold">Meu Perfil</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    className="input-field pl-10 w-full"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="input-field pl-10 w-full"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    className="input-field pl-10 w-full"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-2">
                  Endereço
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    className="input-field pl-10 w-full"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* CPF */}
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  id="cpf"
                  className="input-field w-full"
                  value={profileData.cpf}
                  onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  id="birthDate"
                  className="input-field w-full"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                  disabled={!isEditing}
                />
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
      </motion.div>
    </div>
  );
};

export default Profile;
