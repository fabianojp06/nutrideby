// Mascaramento de dados sensíveis para LOG (regra de compliance: nunca
// gravar PII em texto plano — ver CLAUDE.md). Usado antes de logar payloads
// de terceiros (ex.: resposta de erro da Asaas), que podem ecoar o CPF/CNPJ
// enviado. Prioriza segurança sobre precisão: pode mascarar a mais, nunca a
// menos. NÃO usar para transformar dado que será persistido/retornado —
// é só para logs.
export function mascararDadosSensiveis(texto: string): string {
  return (
    texto
      // CNPJ (14 dígitos) primeiro — com ou sem máscara (pontos/barra/hífen).
      // Rodar antes do CPF evita que o padrão de 11 dígitos case um pedaço
      // de um CNPJ ainda não mascarado.
      .replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, mascararDocumento)
      // CPF (11 dígitos).
      .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, mascararDocumento)
  );
}

// Substitui um CPF/CNPJ por uma forma que preserva só os 2 últimos dígitos
// (suficiente para correlacionar em suporte sem expor o documento).
function mascararDocumento(doc: string): string {
  const digitos = doc.replace(/\D/g, '');
  return `***${digitos.slice(-2)}`;
}
