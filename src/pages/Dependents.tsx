
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Pencil, Trash2, User, Calendar, Save } from "lucide-react";
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
  const [isAddingDependent, setIsAddingDependent] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([
    {
      id: "1",
      name: "Maria Silva",
      birthDate: "2015-05-15",
      relationship: "Filha"
    },
    {
      id: "2",
      name: "Pedro Silva",
      birthDate: "2018-03-10",
      relationship: "Filho"
    }
  ]);
  const [newDependent, setNewDependent] = useState<Omit<Dependent, "id">>({
    name: "",
    birthDate: "",
    relationship: ""
  });

  const handleAddDependent = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    setDependents([...dependents, { ...newDependent, id }]);
    setNewDependent({ name: "", birthDate: "", relationship: "" });
    setIsAddingDependent(false);
    toast.success("Dependente adicionado com sucesso!");
  };

  const handleEditDependent = (id: string, updatedData: Partial<Dependent>) => {
    setDependents(dependents.map(dep => 
      dep.id === id ? { ...dep, ...updatedData } : dep
    ));
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    toast.success("Dependente atualizado com sucesso!");
  };

  const handleDeleteDependent = (id: string) => {
    setDependents(dependents.filter(dep => dep.id !== id));
    toast.success("Dependente removido com sucesso!");
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
            <h1 className="text-2xl font-semibold">Meus Dependentes</h1>
          </div>
          <button
            onClick={() => setIsAddingDependent(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Dependente
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {isAddingDependent ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddDependent}
              className="space-y-4 mb-6"
            >
              <h2 className="text-lg font-medium mb-4">Adicionar Novo Dependente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      required
                      type="text"
                      id="name"
                      className="input-field pl-10 w-full"
                      value={newDependent.name}
                      onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium mb-2">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      required
                      type="date"
                      id="birthDate"
                      className="input-field pl-10 w-full"
                      value={newDependent.birthDate}
                      onChange={(e) => setNewDependent({ ...newDependent, birthDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium mb-2">
                    Parentesco
                  </label>
                  <select
                    required
                    id="relationship"
                    className="input-field w-full"
                    value={newDependent.relationship}
                    onChange={(e) => setNewDependent({ ...newDependent, relationship: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Pai/Mãe">Pai/Mãe</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDependent(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Adicionar
                </button>
              </div>
            </motion.form>
          ) : dependents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Você ainda não possui dependentes cadastrados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dependents.map((dependent) => (
                <motion.div
                  key={dependent.id}
                  layout
                  className="border rounded-lg p-4"
                >
                  {editingId === dependent.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          className="input-field"
                          value={dependent.name}
                          onChange={(e) => handleEditDependent(dependent.id, { name: e.target.value })}
                        />
                        <input
                          type="date"
                          className="input-field"
                          value={dependent.birthDate}
                          onChange={(e) => handleEditDependent(dependent.id, { birthDate: e.target.value })}
                        />
                        <select
                          className="input-field"
                          value={dependent.relationship}
                          onChange={(e) => handleEditDependent(dependent.id, { relationship: e.target.value })}
                        >
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Pai/Mãe">Pai/Mãe</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(dependent.id)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{dependent.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(dependent.birthDate).toLocaleDateString('pt-BR')} • {dependent.relationship}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(dependent.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDependent(dependent.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dependents;
