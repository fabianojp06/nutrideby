/**
 * Camada de acesso à API — hoje retorna dados mockados.
 * Quando services/api-gateway estiver disponível, trocar as implementações
 * abaixo por fetch()/axios contra o gateway, mantendo as mesmas assinaturas.
 */

import {
  faturasMock,
  pacientesMock,
  planosAlimentaresMock,
  prontuariosMock,
} from "@/lib/mock-data";
import { Fatura, Paciente, PlanoAlimentar, Prontuario } from "@/types";

export async function getPacientes(): Promise<Paciente[]> {
  return pacientesMock;
}

export async function getPaciente(id: string): Promise<Paciente | undefined> {
  return pacientesMock.find((p) => p.id === id);
}

export async function getProntuario(
  pacienteId: string
): Promise<Prontuario | undefined> {
  return prontuariosMock[pacienteId];
}

export async function getPlanosAlimentares(): Promise<PlanoAlimentar[]> {
  return planosAlimentaresMock;
}

export async function getPlanoAlimentar(
  id: string
): Promise<PlanoAlimentar | undefined> {
  return planosAlimentaresMock.find((p) => p.id === id);
}

export async function getFaturas(): Promise<Fatura[]> {
  return faturasMock;
}
