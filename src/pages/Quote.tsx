import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, ChevronRight, Calculator, Upload, Pencil, Trash2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import ConfirmDialog from "../components/ConfirmDialog";

interface VaccineOption {
  ref_vacinasID: number;
  nome: string;
  preco: number;
  valor_plano: number | null;
  status: boolean;
  qtd_doses: number;
  percentual: number | null;
  esquema: {
    dose_1: boolean;
    dose_2: boolean;
    dose_3: boolean;
    dose_4: boolean;
    dose_5: boolean;
  };
  doses_selecionadas?: number;
}

interface Person {
  id: string;
  name: string;
  vaccines: string[];
}

interface InsuranceProvider {
  id: number;
  name: string;
}

interface QuoteData {
  id: string;
  created_at: string;
  user_id: string;
  total: number;
  nome_paciente: string;
  vacinas: number[];
}

interface VaccineDetailsModalProps {
  vaccine: VaccineOption;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (isForPlan: boolean, doses?: number) => void;
}

const VaccineDetailsModal = ({ vaccine, isOpen, onClose, onSelect }: VaccineDetailsModalProps) => {
  const [selectedDoses, setSelectedDoses] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-4">{vaccine.nome}</h3>
        <div className="space-y-3">
          <p className="text-sm">Quantidade de doses: {vaccine.qtd_doses}</p>
          <p className="text-sm">Valor avulso: R$ {vaccine.preco.toFixed(2)}</p>
          {vaccine.valor_plano && (
            <p className="text-sm">
              Valor no plano: R$ {vaccine.valor_plano.toFixed(2)}
              {vaccine.percentual && (
                <span className="text-xs ml-1">({vaccine.percentual}% de desconto)</span>
              )}
            </p>
          )}
          {vaccine.valor_plano && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Selecionar doses:</label>
              <select
                value={selectedDoses}
                onChange={(e) => setSelectedDoses(parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                {[...Array(vaccine.qtd_doses)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'dose' : 'doses'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              onSelect(false);
              onClose();
            }}
            className="flex-1 py-2 px-4 text-white rounded-lg bg-primary hover:bg-primary/90"
          >
            Avulsa
          </button>
          {vaccine.valor_plano && (
            <button
              onClick={() => {
                onSelect(true, selectedDoses);
                onClose();
              }}
              className="flex-1 py-2 px-4 text-white rounded-lg bg-green-500 hover:bg-green-600"
            >
              Plano ({selectedDoses} {selectedDoses === 1 ? 'dose' : 'doses'})
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const Quote = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaccineOptions, setVaccineOptions] = useState<VaccineOption[]>([]);
  const [person, setPerson] = useState<Person>({
    id: "1",
    name: "Eu",
    vaccines: []
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planVaccines, setPlanVaccines] = useState<VaccineOption[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  
  const insuranceProviders: InsuranceProvider[] = [
    { id: 1, name: "Unimed" },
    { id: 2, name: "Bradesco Saúde" },
    { id: 3, name: "Amil" },
    { id: 4, name: "SulAmérica" },
    { id: 5, name: "NotreDame Intermédica" },
  ];

  useEffect(() => {
    loadUserData();
    loadQuotes();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('user')
        .select('nome')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setPerson(prev => ({
        ...prev,
        name: userData.nome || 'Eu'
      }));
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadVaccines = async () => {
    try {
      // Primeiro buscar as vacinas
      const { data: vaccines, error: vaccinesError } = await supabase
        .from('ref_vacinas')
        .select('*')
        .eq('status', true)
        .order('nome');

      if (vaccinesError) throw vaccinesError;

      // Buscar os percentuais e valores do plano
      const { data: percentuais, error: percentuaisError } = await supabase
        .from('vacina_percentual')
        .select('*')
        .in('vacina_id', vaccines?.map(v => v.ref_vacinasID) || []);

      if (percentuaisError) throw percentuaisError;

      // Depois buscar os esquemas para cada vacina
      const { data: esquemas, error: esquemasError } = await supabase
        .from('esquema')
        .select('*')
        .in('vacina_fk', vaccines?.map(v => v.ref_vacinasID) || []);

      if (esquemasError) throw esquemasError;

      // Combinar os dados
      const vaccinesWithDoses = vaccines?.map(vaccine => {
        const esquema = esquemas?.find(e => e.vacina_fk === vaccine.ref_vacinasID) || {
          dose_1: false,
          dose_2: false,
          dose_3: false,
          dose_4: false,
          dose_5: false
        };

        const percentualInfo = percentuais?.find(p => p.vacina_id === vaccine.ref_vacinasID);

        return {
          ...vaccine,
          esquema,
          valor_plano: percentualInfo?.valor_plano || null,
          percentual: percentualInfo?.percentual || null,
          qtd_doses: Object.values(esquema)
            .filter(value => typeof value === 'boolean' && value === true)
            .length
        };
      }) || [];

      setVaccineOptions(vaccinesWithDoses);
    } catch (error) {
      console.error('Erro ao carregar vacinas:', error);
      toast.error('Erro ao carregar lista de vacinas');
    }
  };

  useEffect(() => {
    loadVaccines();
  }, []);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      toast.error("Erro ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteQuote = async () => {
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', confirmDelete);

      if (error) {
        console.error('Erro ao excluir:', error);
        throw error;
      }

      await loadQuotes();
      toast.success('Orçamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir orçamento');
    } finally {
      setConfirmDelete(null);
    }
  };

  const updatePersonName = (name: string) => {
    setPerson({ ...person, name });
  };

  const toggleVaccine = (vaccineId: string) => {
    const vaccines = person.vaccines.includes(vaccineId)
      ? person.vaccines.filter(id => id !== vaccineId)
      : [...person.vaccines, vaccineId];
    setPerson({ ...person, vaccines });
  };

  const handleFileUpload = async (files: FileList | null) => {
    try {
      if (!files) return;

      const uploadedFiles = [];
      
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `planos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('PlanodeSaude')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('PlanodeSaude')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: publicUrl
        });
      }

      setUploadedFiles(uploadedFiles);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivo');
    }
  };

  const handleRemoveFile = async (index: number) => {
    try {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      toast.success('Arquivo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const calculateTotal = () => {
    return person.vaccines.reduce((total, vaccineId) => {
      const vaccine = vaccineOptions.find(v => v.ref_vacinasID.toString() === vaccineId);
      if (!vaccine) return total;
      return total + vaccine.preco;
    }, 0);
  };

  const handleEdit = async (quote: QuoteData) => {
    setPerson({
      id: quote.id,
      name: quote.nome_paciente,
      vaccines: quote.vacinas.map(String), // Convertendo number[] para string[]
    });
    setActiveTab('create');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (person.vaccines.length === 0) {
        toast.error("Selecione pelo menos uma vacina para criar o orçamento");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate('/login');
        return;
      }

      const quoteData = {
        user_id: user.id,
        vacinas: person.vaccines.map(Number),
        total: calculateTotal(),
        nome_paciente: person.name
      };

      if (person.id && person.id !== "1") {
        const { error } = await supabase
          .from('orcamentos')
          .update(quoteData)
          .eq('id', person.id);

        if (error) throw error;
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('orcamentos')
          .insert([quoteData]);

        if (error) throw error;
        toast.success("Orçamento criado com sucesso!");
      }

      await loadQuotes();
      setActiveTab('list');
      
      // Verificar se há vacinas no plano e mostrar notificação
      if (planVaccines.length > 0) {
        toast("Você tem um plano de vacinação pendente!", {
          description: "Clique aqui para solicitar via WhatsApp",
          action: {
            label: "Solicitar",
            onClick: () => handlePlanCheckout()
          },
          duration: 10000 // 10 segundos
        });
      }

      setPerson({
        id: "1",
        name: "Eu",
        vaccines: []
      });
      
      // Limpar as vacinas do plano
      setPlanVaccines([]);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao salvar orçamento. Tente novamente.");
    }
  };

  const handleVaccineClick = (vaccine: VaccineOption) => {
    setSelectedVaccine(vaccine);
    setIsModalOpen(true);
  };

  const handleVaccineSelect = (isForPlan: boolean, doses?: number) => {
    if (!selectedVaccine) return;

    if (isForPlan) {
      setPlanVaccines(prev => [...prev, { ...selectedVaccine, doses_selecionadas: doses || 1 }]);
    } else {
      toggleVaccine(selectedVaccine.ref_vacinasID.toString());
    }
  };

  const handlePlanCheckout = () => {
    if (planVaccines.length === 0) {
      toast.error("Selecione pelo menos uma vacina para o plano");
      return;
    }

    const total = planVaccines.reduce((sum, vaccine) => {
      return sum + (vaccine.valor_plano || 0) * (vaccine.doses_selecionadas || vaccine.qtd_doses);
    }, 0);

    const message = `Olá! Gostaria de fazer um plano de vacinação com as seguintes vacinas:\n\n${
      planVaccines.map(v => `- ${v.nome} (${v.doses_selecionadas || v.qtd_doses} doses)`).join('\n')
    }\n\nValor total: R$ ${total.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/5534993130077?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Orçar Vacinas</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'list' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('list')}
          >
            Meus Orçamentos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'create' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Novo Orçamento
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'list' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum orçamento encontrado</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 btn-primary"
                >
                  Criar Novo Orçamento
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="font-medium">{quote.nome_paciente}</p>
                        <div className="mt-2">
                          {quote.vacinas.map(vaccineId => {
                            const vaccine = vaccineOptions.find(v => v.ref_vacinasID === vaccineId);
                              return vaccine?.status ? (
                                <span 
                                  key={vaccineId}
                                  className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                                >
                                  {vaccine.nome}
                                </span>
                              ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/schedule', { 
                            state: { 
                              vaccines: quote.vacinas,
                              total: quote.total 
                            }
                          })}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-primary"
                          title="Agendar"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(quote)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="font-medium">
                        R$ {quote.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium">Dados do Paciente</h2>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="mb-4">
                    <input
                      type="text"
                      value={person.name}
                      className="input-field"
                      placeholder="Nome do paciente"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {vaccineOptions.map((vaccine) => (
                      <div
                        key={`${person.id}-${vaccine.ref_vacinasID}`}
                        className={`p-4 border rounded-lg transition-colors ${
                          person.vaccines.includes(vaccine.ref_vacinasID.toString()) || 
                          planVaccines.some(v => v.ref_vacinasID === vaccine.ref_vacinasID)
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <h3 className="text-lg font-medium">{vaccine.nome}</h3>
                          
                          <div className="flex flex-wrap gap-2 mt-1">
                            {vaccine.esquema.dose_1 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dose 1</span>}
                            {vaccine.esquema.dose_2 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dose 2</span>}
                            {vaccine.esquema.dose_3 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dose 3</span>}
                            {vaccine.esquema.dose_4 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dose 4</span>}
                            {vaccine.esquema.dose_5 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Dose 5</span>}
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div>
                              <p className="text-sm text-gray-600">Valor avulso: <span className="font-medium">R$ {vaccine.preco.toFixed(2)}</span></p>
                              {vaccine.valor_plano && (
                                <p className="text-sm text-green-600">
                                  Valor no plano: <span className="font-medium">R$ {vaccine.valor_plano.toFixed(2)}</span>
                                  {vaccine.percentual && (
                                    <span className="text-xs ml-1">({vaccine.percentual}% de desconto)</span>
                                  )}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => toggleVaccine(vaccine.ref_vacinasID.toString())}
                                disabled={planVaccines.some(v => v.ref_vacinasID === vaccine.ref_vacinasID)}
                                className={`px-4 py-2 text-white rounded-lg ${
                                  planVaccines.some(v => v.ref_vacinasID === vaccine.ref_vacinasID)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : person.vaccines.includes(vaccine.ref_vacinasID.toString())
                                    ? 'bg-primary/70 hover:bg-primary/60'
                                    : 'bg-primary hover:bg-primary/90'
                                }`}
                              >
                                {person.vaccines.includes(vaccine.ref_vacinasID.toString()) ? 'Remover' : 'Avulsa'}
                              </button>
                              {vaccine.valor_plano && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVaccine(vaccine);
                                    setIsModalOpen(true);
                                  }}
                                  disabled={person.vaccines.includes(vaccine.ref_vacinasID.toString())}
                                  className={`px-4 py-2 text-white rounded-lg ${
                                    person.vaccines.includes(vaccine.ref_vacinasID.toString())
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : planVaccines.some(v => v.ref_vacinasID === vaccine.ref_vacinasID)
                                      ? 'bg-green-400 hover:bg-green-500'
                                      : 'bg-green-500 hover:bg-green-600'
                                  }`}
                                >
                                  {planVaccines.some(v => v.ref_vacinasID === vaccine.ref_vacinasID) ? 'Remover' : 'Plano'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Resumo do Orçamento</h2>
              
              {person.vaccines.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Vacinas Avulsas</h3>
                  <div className="space-y-2">
                    {person.vaccines.map(vaccineId => {
                      const vaccine = vaccineOptions.find(v => v.ref_vacinasID.toString() === vaccineId);
                      if (!vaccine) return null;
                      return (
                        <div key={vaccineId} className="flex justify-between text-sm">
                          <span>{vaccine.nome}</span>
                          <span>R$ {vaccine.preco.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Avulso</span>
                  <span>R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  Salvar Orçamento
                  <Calculator className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteQuote}
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2">
              <a href={file.url} target="_blank" className="text-blue-500 hover:underline">
                {file.name}
              </a>
              <button onClick={() => handleRemoveFile(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {planVaccines.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Plano de Vacinação</h2>
          <div className="space-y-3">
            {planVaccines.map((vaccine) => (
              <div key={vaccine.ref_vacinasID} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{vaccine.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-sm text-gray-500">Doses:</label>
                    <select
                      value={vaccine.doses_selecionadas || vaccine.qtd_doses}
                      onChange={(e) => {
                        const doses = parseInt(e.target.value);
                        setPlanVaccines(prev =>
                          prev.map(v =>
                            v.ref_vacinasID === vaccine.ref_vacinasID
                              ? { ...v, doses_selecionadas: doses }
                              : v
                          )
                        );
                      }}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {[...Array(vaccine.qtd_doses)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'dose' : 'doses'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    R$ {((vaccine.valor_plano || 0) * (vaccine.doses_selecionadas || vaccine.qtd_doses)).toFixed(2)}
                  </p>
                  <button
                    onClick={() => setPlanVaccines(prev => prev.filter(v => v.ref_vacinasID !== vaccine.ref_vacinasID))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t mt-4">
              <button
                onClick={handlePlanCheckout}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Solicitar Plano via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <VaccineDetailsModal
        vaccine={selectedVaccine!}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleVaccineSelect}
      />
    </div>
  );
};

export default Quote;
