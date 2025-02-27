import { useState } from "react";
import { ArrowLeft, Send, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Implementar integração com Brevo
      /* 
      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(Brevo.ApiClient.instance.authentications['api-key'], 'YOUR_BREVO_API_KEY');

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = `Novo contato: ${formData.subject}`;
      sendSmtpEmail.htmlContent = `
        <p><strong>Nome:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Telefone:</strong> ${formData.phone}</p>
        <p><strong>Assunto:</strong> ${formData.subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${formData.message}</p>
      `;
      sendSmtpEmail.sender = { name: formData.name, email: formData.email };
      sendSmtpEmail.to = [{ email: 'vaccini@vaccini.com.br', name: 'Vaccini' }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      */

      console.log('Dados do formulário:', formData); // Para debug
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem. Tente novamente mais tarde.");
    }
  };

  const handleWhatsAppClick = () => {
    window.open('https://api.whatsapp.com/send/?phone=552135762186&text&type=phone_number&app_absent=0', '_blank');
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

        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Painel do Paciente - Vaccini</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Informações de Contato</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Telefone/WhatsApp</h3>
                    <button 
                      onClick={handleWhatsAppClick}
                      className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      (21) 3576-2186
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-sm text-gray-500">vaccini@vaccini.com.br</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Ouvidoria</h3>
                    <p className="text-sm text-gray-500">ouvidoria@vaccini.com.br</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Envie sua Mensagem</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="input-field w-full"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="input-field w-full"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="input-field w-full"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Assunto
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      className="input-field w-full"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="agendamento">Agendamento</option>
                      <option value="informacoes">Informações</option>
                      <option value="sugestao">Sugestão</option>
                      <option value="reclamacao">Reclamação</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="input-field w-full h-32 resize-none"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                  >
                    Enviar Mensagem
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
