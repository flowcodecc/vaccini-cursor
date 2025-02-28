
import { useState } from "react";
import { ArrowLeft, Plus, Trash, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Dependent {
  id: string;
  name: string;
  birthDate: string;
  relationship: string;
}

const Dependents = () => {
  const navigate = useNavigate();
  const [dependents, setDependents] = useState<Dependent[]>([
    {
      id: "1",
      name: "Maria Silva",
      birthDate: "2010-05-15",
      relationship: "Filha"
    }
  ]);
  
  const [newDependent, setNewDependent] = useState({
    name: "",
    birthDate: "",
    relationship: ""
  });
  
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDependent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = (dependents.length + 1).toString();
    const dependent = {
      id,
      ...newDependent
    };
    
    setDependents([...dependents, dependent]);
    setNewDependent({
      name: "",
      birthDate: "",
      relationship: ""
    });
    
    setShowForm(false);
    toast.success("Dependente adicionado com sucesso!");
  };

  const handleRemove = (id: string) => {
    setDependents(dependents.filter(dep => dep.id !== id));
    toast.success("Dependente removido com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
       

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold">Meus Dependentes</h1>
          </div>
          
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Cancelar" : "Adicionar Dependente"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Adicionar Novo Dependente</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="input-field w-full"
                  value={newDependent.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    className="input-field w-full"
                    value={newDependent.birthDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium mb-2">
                    Parentesco
                  </label>
                  <select
                    id="relationship"
                    name="relationship"
                    className="input-field w-full"
                    value={newDependent.relationship}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Pai/Mãe">Pai/Mãe</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {dependents.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">Nenhum dependente cadastrado</h2>
              <p className="text-gray-500 mb-4">
                Adicione seus dependentes para gerenciar suas vacinas.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Adicionar Dependente
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {dependents.map((dependent) => (
                <div key={dependent.id} className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{dependent.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>
                        Nascimento: {new Date(dependent.birthDate).toLocaleDateString('pt-BR')}
                      </p>
                      <p>Parentesco: {dependent.relationship}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(dependent.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dependents;
