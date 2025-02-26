
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VaccineOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

const Schedule = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState<string[]>([]);

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
  ];

  const units = [
    { id: "1", name: "Unidade Centro", address: "Rua do Centro, 123" },
    { id: "2", name: "Unidade Norte", address: "Av. Norte, 456" },
    { id: "3", name: "Unidade Sul", address: "Rua Sul, 789" },
  ];

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVaccine.length > 0 && selectedDate && selectedTime && selectedUnit) {
      navigate("/schedule-confirmation");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
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
          <h1 className="text-2xl font-semibold">Agendar Vacina</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Vacinas */}
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
                      className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <div>
                      <h3 className="font-medium">{vaccine.name}</h3>
                      <p className="text-sm text-gray-500">{vaccine.description}</p>
                    </div>
                  </div>
                  <span className="font-medium">R$ {vaccine.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Unidade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Selecione a Unidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUnit === unit.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                  }`}
                  onClick={() => setSelectedUnit(unit.id)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium">{unit.name}</h3>
                      <p className="text-sm text-gray-500">{unit.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Data e Hora */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Selecione Data e Horário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="input-field pl-10 w-full"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Horário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="input-field pl-10 w-full"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Selecione um horário</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={!selectedVaccine.length || !selectedDate || !selectedTime || !selectedUnit}
            >
              Confirmar Agendamento
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Schedule;
