import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Clock, Phone, Mail, MapPin, User, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SolicitacaoAgendamento {
  id: number;
  nome_usuario: string;
  email_usuario: string;
  telefone_usuario: string;
  cep_usuario: string;
  nome_vacina: string;
  nome_unidade: string;
  endereco_completo_unidade: string;
  telefone_unidade: string;
  observacoes: string;
  status: 'pendente' | 'em_andamento' | 'finalizado' | 'cancelado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  data_solicitacao: string;
  data_contato: string | null;
  nome_atendente: string | null;
  observacoes_atendente: string | null;
  horas_em_espera: number | null;
  atrasada: boolean;
}

const SolicitacoesAgendamento = () => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoAgendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [novoStatus, setNovoStatus] = useState<string>('');

  useEffect(() => {
    carregarSolicitacoes();
  }, [filtroStatus, filtroPrioridade]);

  const carregarSolicitacoes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('view_solicitacoes_agendamento')
        .select('*');

      // Aplicar filtros
      if (filtroStatus !== 'todas') {
        query = query.eq('status', filtroStatus);
      }

      if (filtroPrioridade !== 'todas') {
        query = query.eq('prioridade', filtroPrioridade);
      }

      // Ordenar por prioridade e data
      query = query.order('prioridade', { ascending: true })
                   .order('data_solicitacao', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar solicitações:', error);
        toast.error('Erro ao carregar solicitações');
        return;
      }

      setSolicitacoes(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .update({
          status,
          data_contato: status === 'em_andamento' ? new Date().toISOString() : null,
          observacoes_atendente: observacoes || null
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
        return;
      }

      toast.success('Status atualizado com sucesso!');
      setSolicitacaoSelecionada(null);
      setObservacoes('');
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'em_andamento':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'finalizado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_andamento: 'bg-blue-100 text-blue-800',
      finalizado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, string> = {
      baixa: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[prioridade] || 'bg-gray-100 text-gray-800'}>
        {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
      </Badge>
    );
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarHorasEspera = (horas: number | null) => {
    if (!horas) return '-';
    
    if (horas < 1) {
      return `${Math.round(horas * 60)} min`;
    } else if (horas < 24) {
      return `${Math.round(horas)}h`;
    } else {
      const dias = Math.floor(horas / 24);
      const horasRestantes = Math.round(horas % 24);
      return `${dias}d ${horasRestantes}h`;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009688]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Solicitações de Agendamento</h1>
        <Button onClick={carregarSolicitacoes} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="finalizado">Finalizadas</SelectItem>
                  <SelectItem value="cancelado">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {solicitacoes.filter(s => s.status === 'pendente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {solicitacoes.filter(s => s.status === 'em_andamento').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Finalizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {solicitacoes.filter(s => s.status === 'finalizado').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {solicitacoes.filter(s => s.atrasada).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações ({solicitacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vacina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id} className={solicitacao.atrasada ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">#{solicitacao.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{solicitacao.nome_usuario}</div>
                        <div className="text-sm text-gray-500">{solicitacao.email_usuario}</div>
                        <div className="text-sm text-gray-500">{solicitacao.telefone_usuario}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{solicitacao.nome_vacina}</div>
                        {solicitacao.nome_unidade && (
                          <div className="text-sm text-gray-500">{solicitacao.nome_unidade}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(solicitacao.status)}
                        {getStatusBadge(solicitacao.status)}
                      </div>
                    </TableCell>
                    <TableCell>{getPrioridadeBadge(solicitacao.prioridade)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatarData(solicitacao.data_solicitacao)}</div>
                        {solicitacao.data_contato && (
                          <div className="text-gray-500">Contato: {formatarData(solicitacao.data_contato)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatarHorasEspera(solicitacao.horas_em_espera)}
                        {solicitacao.atrasada && (
                          <div className="text-red-500 text-xs">Atrasada</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSolicitacaoSelecionada(solicitacao);
                              setNovoStatus(solicitacao.status);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Solicitação #{solicitacao.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Informações do Cliente */}
                            <div>
                              <h3 className="font-semibold mb-2">Informações do Cliente</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {solicitacao.nome_usuario}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {solicitacao.email_usuario}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {solicitacao.telefone_usuario}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    CEP: {solicitacao.cep_usuario}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Informações da Solicitação */}
                            <div>
                              <h3 className="font-semibold mb-2">Solicitação</h3>
                              <div className="text-sm space-y-2">
                                <div><strong>Vacina:</strong> {solicitacao.nome_vacina}</div>
                                {solicitacao.nome_unidade && (
                                  <div><strong>Unidade:</strong> {solicitacao.nome_unidade}</div>
                                )}
                                <div><strong>Status:</strong> {getStatusBadge(solicitacao.status)}</div>
                                <div><strong>Prioridade:</strong> {getPrioridadeBadge(solicitacao.prioridade)}</div>
                                <div><strong>Data:</strong> {formatarData(solicitacao.data_solicitacao)}</div>
                                {solicitacao.observacoes && (
                                  <div><strong>Observações:</strong> {solicitacao.observacoes}</div>
                                )}
                              </div>
                            </div>

                            {/* Ações */}
                            <div>
                              <h3 className="font-semibold mb-2">Atualizar Status</h3>
                              <div className="space-y-4">
                                <Select value={novoStatus} onValueChange={setNovoStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                    <SelectItem value="finalizado">Finalizado</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Textarea
                                  placeholder="Observações do atendente..."
                                  value={observacoes}
                                  onChange={(e) => setObservacoes(e.target.value)}
                                />
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => atualizarStatus(solicitacao.id, novoStatus)}
                                    className="bg-[#009688] hover:bg-[#00796B]"
                                  >
                                    Atualizar Status
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      // Aqui você pode implementar ações como ligar, enviar email, etc.
                                      window.open(`tel:${solicitacao.telefone_usuario}`, '_self');
                                    }}
                                  >
                                    Ligar
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      window.open(`mailto:${solicitacao.email_usuario}`, '_self');
                                    }}
                                  >
                                    Email
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolicitacoesAgendamento;
