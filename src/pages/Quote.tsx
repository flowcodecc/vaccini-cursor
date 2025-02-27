
import { useState } from "react";
import { ArrowLeft, Plus, Minus, ChevronRight, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface VaccineOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Person {
  id: string;
  name: string;
  vaccines: string[];
}

const Quote = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "Eu", vaccines: [] }
  ]);
  
  const vaccineOptions: VaccineOption[] = [
    { 
      id: "1", 
      name: "Vacina contra Gripe",
      description: "Proteção contra os vírus da gripe sazonal",
      price: 90.00
    },
    { 
      id: "2", 
      name: "COVID-19",
      description: "Imunização contra o coronavírus",
      price: 120.00
    },
    { 
      id: "3", 
      name: "Hepatite B",
      description: "Prevenção contra a hepatite B",
      price: 150.00
    },
    { 
      id: "4", 
      name: "Febre Amarela",
      description: "Prevenção contra a febre amarela",
      price: 110.00
    },
    { 
      id: "5", 
      name: "Tétano",
      description: "Proteção contra o tétano",
      price: 80.00
    },
  ];

  const addPerson = () => {
    const newId = (people.length + 1).toString();
    setPeople([...people, { id: newId, name: `Pessoa ${newId}`, vaccines: [] }]);
  };

  const removePerson = (id: string) => {
    if (people.length > 1) {
      setPeople(people.filter(person => person.id !== id));
    }
  };

  const updatePersonName = (id: string, name: string) => {
    setPeople(people.map(person => 
      person.id === id ? { ...person, name } : person
    ));
  };

  const toggleVaccine = (personId: string, vaccineId: string) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        const vaccines = person.vaccines.includes(vaccineId)
          ? person.vaccines.filter(id => id !== vaccineId)
          : [...person.vaccines, vaccineId];
        return { ...person, vaccines };
      }
      return person;
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    people.forEach(person => {
      person.vaccines.forEach(vaccineId => {
        const vaccine = vaccineOptions.find(v => v.id === vaccineId);
        if (vaccine) {
          total += vaccine.price;
        }
      });
    });
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se pelo menos um item foi selecionado
    const hasSelection = people.some(person => person.vaccines.length > 0);
    
    if (!hasSelection) {
      toast.error("Selecione pelo menos uma vacina para continuar.");
      return;
    }
    
    toast.success("Orçamento enviado com sucesso! Entraremos em contato em breve.");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div 
        className="max-w-4xl mx-auto opacity-100"
      >
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/lovable-uploads/6bb7863c-28a4-4e24-bc14-c6b7ee65c219.png" 
            alt="Vaccini Logo" 
            className="h-20 mb-4"
          />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Orçar Vacinas</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Selecione as Pessoas</h2>
              <button
                type="button"
                onClick={addPerson}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Pessoa
              </button>
            </div>

            <div className="space-y-4">
              {people.map((person, index) => (
                <div
                  key={person.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePersonName(person.id, e.target.value)}
                        className="input-field"
                        placeholder="Nome da pessoa"
                      />
                    </div>
                    {people.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePerson(person.id)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {vaccineOptions.map((vaccine) => (
                      <div
                        key={`${person.id}-${vaccine.id}`}
                        className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          person.vaccines.includes(vaccine.id) ? 'border-primary bg-primary/5' : 'hover:border-primary'
                        }`}
                        onClick={() => toggleVaccine(person.id, vaccine.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={person.vaccines.includes(vaccine.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <div>
                            <h3 className="text-sm font-medium">{vaccine.name}</h3>
                            <p className="text-xs text-gray-500">{vaccine.description}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">R$ {vaccine.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Resumo do Orçamento</h2>
            
            <div className="space-y-3 mb-4">
              {people.map((person) => {
                const personTotal = person.vaccines.reduce((total, vaccineId) => {
                  const vaccine = vaccineOptions.find(v => v.id === vaccineId);
                  return total + (vaccine?.price || 0);
                }, 0);
                
                if (personTotal > 0) {
                  return (
                    <div key={person.id} className="flex justify-between text-sm">
                      <span>{person.name}</span>
                      <span>R$ {personTotal.toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })}
              
              <div className="border-t pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span>R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
              >
                Solicitar Orçamento
                <Calculator className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Quote;
