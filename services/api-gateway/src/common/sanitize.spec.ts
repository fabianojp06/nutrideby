import { mascararDadosSensiveis } from './sanitize';

// Item 15 (LGPD): garante que CPF/CNPJ nunca sobrevive em texto plano num log.
describe('mascararDadosSensiveis', () => {
  it('mascara CPF sem máscara (11 dígitos), preservando só os 2 últimos', () => {
    expect(mascararDadosSensiveis('doc 12345678909 fim')).toBe('doc ***09 fim');
  });

  it('mascara CPF com máscara', () => {
    expect(mascararDadosSensiveis('123.456.789-09')).toBe('***09');
  });

  it('mascara CNPJ sem máscara (14 dígitos)', () => {
    expect(mascararDadosSensiveis('11222333000181')).toBe('***81');
  });

  it('mascara CNPJ com máscara', () => {
    expect(mascararDadosSensiveis('11.222.333/0001-81')).toBe('***81');
  });

  it('mascara dentro de um JSON de erro da Asaas (cenário real do log)', () => {
    const payload = JSON.stringify({
      errors: [{ code: 'invalid_cpfCnpj', description: 'CPF/CNPJ 12345678909 inválido' }],
    });
    const saida = mascararDadosSensiveis(payload);
    expect(saida).not.toContain('12345678909');
    expect(saida).toContain('***09');
    // Mantém o resto do payload útil para depuração.
    expect(saida).toContain('invalid_cpfCnpj');
  });

  it('não altera texto sem documentos', () => {
    const texto = 'Asaas POST /customers falhou (401): unauthorized';
    expect(mascararDadosSensiveis(texto)).toBe(texto);
  });

  it('mascara múltiplos documentos na mesma string', () => {
    const saida = mascararDadosSensiveis('cpf 12345678909 e cnpj 11.222.333/0001-81');
    expect(saida).not.toMatch(/12345678909/);
    expect(saida).not.toMatch(/0001-81/);
  });
});
