import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DadosAntropometricosRag {
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'feminino' | 'masculino' | 'outro';
  circunferencia_cintura_cm?: number;
  percentual_gordura?: number;
  imc?: number;
}

interface AnamneseRag {
  queixa_principal?: string;
  historico_clinico?: string;
  medicamentos_uso_continuo: string[];
  alergias_intolerancias: string[];
  habitos_alimentares?: string;
  nivel_atividade_fisica?: string;
  objetivo?: string;
  observacoes_adicionais?: string;
}

export interface GerarRascunhoParams {
  pacienteId: string;
  nutricionistaId: string;
  dataNascimento?: Date | null;
  anamnese: AnamneseRag;
  antropometria: DadosAntropometricosRag;
  perguntaNutricionista: string;
}

export interface RascunhoIA {
  rascunho: string;
  fontesUtilizadas: { source: string; trecho: string; similaridade: number }[];
  modeloUtilizado: string;
  disclaimer: string;
}

// Cliente HTTP fino para o services/rag-agent (FastAPI, serviço interno —
// nunca exposto diretamente ao paciente). Mesmo padrão do AsaasService.
@Injectable()
export class RagAgentService {
  private readonly logger = new Logger(RagAgentService.name);

  constructor(private readonly config: ConfigService) {}

  async gerarRascunho(params: GerarRascunhoParams): Promise<RascunhoIA> {
    const baseUrl = this.config.get<string>('RAG_AGENT_BASE_URL', 'http://localhost:8000');
    // Timeout configurável; default 20s (folga sobre o alvo de <15s da US-08).
    const timeoutMs = this.config.get<number>('RAG_AGENT_TIMEOUT_MS', 20000);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/rascunho-plano-alimentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prontuario: {
            paciente_id: params.pacienteId,
            data_nascimento: params.dataNascimento
              ? params.dataNascimento.toISOString().slice(0, 10)
              : undefined,
            anamnese: params.anamnese,
            dados_antropometricos: params.antropometria,
          },
          pergunta_nutricionista: params.perguntaNutricionista,
          nutricionista_id: params.nutricionistaId,
        }),
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      // Log sem PII: nunca o prontuário/rascunho — apenas o motivo da falha.
      this.logger.error(
        `rag-agent inacessível (${isTimeout ? 'timeout' : 'rede'}) após ${timeoutMs}ms`,
      );
      throw new ServiceUnavailableException(
        isTimeout
          ? 'O Agente Clínico está demorando para responder. Tente novamente em instantes.'
          : 'Agente Clínico indisponível no momento. Tente novamente em instantes.',
      );
    } finally {
      clearTimeout(timer);
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      // Não logar o corpo (pode conter dado do prontuário) — só o status.
      this.logger.error(`rag-agent respondeu ${response.status}`);
      throw new InternalServerErrorException(
        typeof payload?.detail === 'string'
          ? payload.detail
          : 'Falha ao gerar rascunho via Agente Clínico RAG.',
      );
    }

    return {
      rascunho: payload.rascunho,
      fontesUtilizadas: payload.fontes_utilizadas ?? [],
      modeloUtilizado: payload.modelo_utilizado,
      disclaimer: payload.disclaimer,
    };
  }
}
