
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface InsuranceProvider {
  id: string;
  name: string;
}

const Schedule = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState<string[]>([]);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null);

  const vaccineOptions = [
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
    }
  ];

  const insuranceProviders: InsuranceProvider[] = [
    { id: "1", name: "Unimed" },
    { id: "2", name: "Bradesco Saúde" },
    { id: "3", name: "Amil" },
    { id: "4", name: "SulAmérica" },
    { id: "5", name: "NotreDame Intermédica" },
  ];

  const units = [
    {
      id: "1",
      name: "Unidade Centro",
      address: "Rua do Centro, 123"
    },
    {
      id: "2",
      name: "Unidade Norte",
      address: "Av. Norte, 456"
    },
    {
      id: "3",
      name: "Unidade Sul",
      address: "Rua Sul, 789"
    }
  ];

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedVaccine.length === 0) {
      toast.error("Selecione pelo menos uma vacina");
      return;
    }
    
    if (hasInsurance && !insuranceDocument) {
      toast.error("Anexe a carteirinha do plano de saúde");
      return;
    }
    
    navigate("/schedule-confirmation");
  };

  const handleFileUpload = (file: File | null) => {
    setInsuranceDocument(file);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-2xl font-semibold">Agendar Vacina</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Selecione as Vacinas</h2>
            <div className="space-y-3">
              {vaccineOptions.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    if (selectedVaccine.includes(vaccine.id)) {
                      setSelectedVaccine(selectedVaccine.filter(id => id !== vaccine.id));
                    } else {
                      setSelectedVaccine([...selectedVaccine, vaccine.id]);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedVaccine.includes(vaccine.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <div>
                      <h3 className="font-medium">{vaccine.name}</h3>
                      <p className="text-sm text-gray-500">{vaccine.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">R$ {vaccine.price.toFixed(2)}</span>
                    {hasInsurance && insuranceDocument && (
                      <p className="text-xs text-green-500">
                        R$ {(vaccine.price * 0.7).toFixed(2)} com desconto
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Plano de Saúde</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has-insurance"
                  checked={hasInsurance}
                  onChange={(e) => {
                    setHasInsurance(e.target.checked);
                    if (!e.target.checked) {
                      setInsuranceProvider("");
                      setInsuranceDocument(null);
                    }
                  }}
                  className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="has-insurance" className="ml-2 text-sm font-medium">
                  Possui plano de saúde (30% de desconto)
                </label>
              </div>

              {hasInsurance && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-sm mb-1">Selecione o plano</label>
                    <select
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="input-field w-full"
                      required={hasInsurance}
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
                        <span className="text-sm">{insuranceDocument ? 'Arquivo selecionado' : 'Selecionar arquivo'}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleFileUpload(file);
                          }}
                          required={hasInsurance}
                        />
                      </label>
                      {insuranceDocument && (
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:underline"
                          onClick={() => handleFileUpload(null)}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    {insuranceDocument && (
                      <p className="text-xs text-gray-500 mt-1">
                        {insuranceDocument.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Escolha a Data e Hora</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Horário</label>
                <select
                  className="input-field w-full"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                >
                  <option value="">Selecione um horário</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Escolha a Unidade</h2>
            <div className="space-y-3">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer ${
                    selectedUnit === unit.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedUnit(unit.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={selectedUnit === unit.id}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-primary rounded-full border-gray-300 focus:ring-primary"
                    />
                    <div>
                      <h3 className="font-medium">{unit.name}</h3>
                      <p className="text-sm text-gray-500">{unit.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={!(selectedVaccine.length > 0 && selectedDate && selectedTime && selectedUnit)}
            >
              Agendar Agora
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;
