
import { useState } from "react";
import { ArrowLeft, Plus, Minus, ChevronRight, Calculator, Upload } from "lucide-react";
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
  hasInsurance: boolean;
  insuranceProvider?: string;
  insuranceDocument?: File | null;
}

interface InsuranceProvider {
  id: string;
  name: string;
}

const Quote = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "Eu", vaccines: [], hasInsurance: false, insuranceDocument: null }
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

  const insuranceProviders: InsuranceProvider[] = [
    { id: "1", name: "Unimed" },
    { id: "2", name: "Bradesco Saúde" },
    { id: "3", name: "Amil" },
    { id: "4", name: "SulAmérica" },
    { id: "5", name: "NotreDame Intermédica" },
  ];

  const addPerson = () => {
    const newId = (people.length + 1).toString();
    setPeople([...people, { 
      id: newId, 
      name: `Pessoa ${newId}`, 
      vaccines: [],
      hasInsurance: false,
      insuranceDocument: null
    }]);
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

  const toggleInsurance = (personId: string, hasInsurance: boolean) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        return { 
          ...person, 
          hasInsurance,
          insuranceProvider: hasInsurance ? person.insuranceProvider : undefined,
          insuranceDocument: hasInsurance ? person.insuranceDocument : null
        };
      }
      return person;
    }));
  };

  const updateInsuranceProvider = (personId: string, insuranceProvider: string) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        return { ...person, insuranceProvider };
      }
      return person;
    }));
  };

  const handleFileUpload = (personId: string, file: File | null) => {
    setPeople(people.map(person => {
      if (person.id === personId) {
        return { ...person, insuranceDocument: file };
      }
      return person;
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    people.forEach(person => {
      // Se a pessoa tem plano de saúde e documento comprobatório, considerar desconto
      const hasValidInsurance = person.hasInsurance && person.insuranceDocument;
      
      person.vaccines.forEach(vaccineId => {
        const vaccine = vaccineOptions.find(v => v.id === vaccineId);
        if (vaccine) {
          // Aplicar 30% de desconto para quem tem plano
          total += hasValidInsurance ? vaccine.price * 0.7 : vaccine.price;
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
    
    // Verificar se todos com plano de saúde têm documento
    const missingDocuments = people.some(person => 
      person.hasInsurance && !person.insuranceDocument
    );
    
    if (missingDocuments) {
      toast.error("Anexe os documentos do plano de saúde para continuar.");
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

                  {/* Opção de Plano de Saúde */}
                  <div className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id={`insurance-${person.id}`}
                        checked={person.hasInsurance}
                        onChange={(e) => toggleInsurance(person.id, e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor={`insurance-${person.id}`} className="ml-2 text-sm font-medium">
                        Possui plano de saúde (30% de desconto)
                      </label>
                    </div>
                    
                    {person.hasInsurance && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <label className="block text-sm mb-1">Selecione o plano</label>
                          <select
                            value={person.insuranceProvider || ""}
                            onChange={(e) => updateInsuranceProvider(person.id, e.target.value)}
                            className="input-field w-full"
                            required={person.hasInsurance}
                          >
                            <option value="">Selecione...</option>
                            {insuranceProviders.map(provider => (
                              <option key={provider.id} value={provider.id}>{provider.name}</option>
                            ))}
                            <option value="other">Outro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm mb-1">Anexe a carteirinha do plano</label>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                              <Upload className="w-4 h-4 text-primary" />
                              <span className="text-sm">{person.insuranceDocument ? 'Arquivo selecionado' : 'Selecionar arquivo'}</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleFileUpload(person.id, file);
                                }}
                                required={person.hasInsurance}
                              />
                            </label>
                            {person.insuranceDocument && (
                              <button
                                type="button"
                                className="text-xs text-red-500 hover:underline"
                                onClick={() => handleFileUpload(person.id, null)}
                              >
                                Remover
                              </button>
                            )}
                          </div>
                          {person.insuranceDocument && (
                            <p className="text-xs text-gray-500 mt-1">
                              {person.insuranceDocument.name}
                            </p>
                          )}
                        </div>
                      </div>
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
                        <div className="text-right">
                          <span className="text-sm font-medium">R$ {vaccine.price.toFixed(2)}</span>
                          {person.hasInsurance && person.insuranceDocument && (
                            <p className="text-xs text-green-500">
                              R$ {(vaccine.price * 0.7).toFixed(2)} com desconto
                            </p>
                          )}
                        </div>
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
                const hasValidInsurance = person.hasInsurance && person.insuranceDocument;
                
                const personTotal = person.vaccines.reduce((total, vaccineId) => {
                  const vaccine = vaccineOptions.find(v => v.id === vaccineId);
                  if (!vaccine) return total;
                  
                  const price = hasValidInsurance ? vaccine.price * 0.7 : vaccine.price;
                  return total + price;
                }, 0);
                
                if (personTotal > 0) {
                  return (
                    <div key={person.id} className="flex justify-between text-sm">
                      <span>
                        {person.name}
                        {hasValidInsurance && (
                          <span className="text-xs text-green-500 ml-2">
                            (com desconto do plano)
                          </span>
                        )}
                      </span>
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
