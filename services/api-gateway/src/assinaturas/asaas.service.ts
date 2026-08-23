import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AsaasCliente {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasAssinatura {
  id: string;
  customer: string;
  status: string;
  nextDueDate: string;
  value: number;
}

interface CriarClienteParams {
  name: string;
  email: string;
  cpfCnpj: string;
}

interface CriarAssinaturaParams {
  customer: string;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  descricao: string;
}

// Cliente HTTP fino para a API da Asaas (sandbox/produção conforme
// ASAAS_BASE_URL). Sem SDK oficial em Node — a API é REST simples o
// suficiente para não justificar uma dependência externa.
@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ASAAS_API_KEY'));
  }

  async criarCliente(params: CriarClienteParams): Promise<AsaasCliente> {
    return this.request<AsaasCliente>('POST', '/customers', params);
  }

  async criarAssinatura(params: CriarAssinaturaParams): Promise<AsaasAssinatura> {
    // billingType UNDEFINED: Asaas gera link de pagamento aceitando Pix e
    // cartão, sem precisarmos construir uma tela própria de captura de
    // cartão nesta fase (ver fase0_estrutura_planos_e_backlog.md).
    return this.request<AsaasAssinatura>('POST', '/subscriptions', {
      customer: params.customer,
      billingType: 'UNDEFINED',
      cycle: 'MONTHLY',
      value: params.value,
      nextDueDate: params.nextDueDate,
      description: params.descricao,
    });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const baseUrl = this.config.get<string>('ASAAS_BASE_URL');
    const apiKey = this.config.get<string>('ASAAS_API_KEY');

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey ?? '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      this.logger.error(`Asaas ${method} ${path} falhou (${response.status}): ${JSON.stringify(payload)}`);
      throw new InternalServerErrorException('Falha ao comunicar com o gateway de pagamento.');
    }

    return payload as T;
  }
}
