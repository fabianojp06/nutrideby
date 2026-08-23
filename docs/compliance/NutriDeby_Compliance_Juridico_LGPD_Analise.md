# Análise do Documento: NutriDeby - Compliance Jurídico e LGPD

Este relatório apresenta uma análise detalhada do documento "NutriDeby_Compliance_Juridico_LGPD(1).docx", que inclui um Contrato de Operadora de Dados Pessoais (DPA), um Termo de Consentimento Informado para Tratamento de Dados Pessoais de Saúde e uma Política de Privacidade e Proteção de Dados da NutriDeby (WSS+13).

## 1. Contrato de Operadora de Dados Pessoais (DPA)

O DPA estabelece as responsabilidades e obrigações entre a **Controladora** (Profissional de Nutrição) e a **Operadora** (WSS+13) no tratamento de dados pessoais sensíveis (dados de saúde) dos pacientes, em conformidade com a Lei Geral de Proteção de Dados (LGPD) brasileira (Lei nº 13.709/2018).

### Partes Envolvidas

*   **Controladora**: Profissional de nutrição (pessoa física ou jurídica) que utiliza a plataforma NutriDeby e determina as finalidades e meios do tratamento dos dados de seus pacientes.
*   **Operadora**: WEB SMART SISTEMAS+13 LTDA (WSS+13), responsável por realizar o tratamento dos dados em nome e sob instrução exclusiva da Controladora, sem deliberação própria sobre finalidade ou meios.
*   **Titular**: O paciente da Controladora, cujos dados pessoais sensíveis são tratados pela Plataforma NutriDeby.

### Definições Chave (baseadas no Art. 5º da LGPD)

*   **Dado pessoal sensível**: Dados de saúde do paciente, incluindo prontuário clínico, resultados laboratoriais, medidas antropométricas, histórico alimentar e objetivos terapêuticos.
*   **Plataforma NutriDeby**: Sistema SaaS de inteligência artificial desenvolvido e operado pela WSS+13, que inclui módulos de ingestão de dados, armazenamento, processamento RAG (Retrieval Augmented Generation), agente conversacional e entrega via WhatsApp Business API.

### Objeto e Finalidade do Tratamento de Dados

O contrato disciplina o tratamento de dados pessoais sensíveis dos pacientes da Controladora pela Operadora, com a finalidade exclusiva de **tutela da saúde dos titulares**. As atividades compreendem:

*   Extração e espelhamento de dados clínicos da plataforma Dietbox.
*   Armazenamento seguro em banco de dados PostgreSQL com extensão pgvector.
*   Processamento de linguagem natural (RAG) para comunicações personalizadas.
*   Entrega de mensagens via WhatsApp Business API (modelo white label).
*   Retroalimentação do prontuário do paciente com informações de interações via WhatsApp, sob supervisão da Controladora.

### Obrigações da Operadora (WSS+13)

A Operadora se compromete a:

*   Tratar dados exclusivamente para as finalidades descritas no contrato, vedando usos não autorizados.
*   Não compartilhar dados com terceiros, exceto subprocessadores listados no Anexo I, com garantias equivalentes de proteção.
*   Implementar medidas técnicas e organizacionais de segurança (criptografia, controle de acesso, logs de auditoria, monitoramento contínuo).
*   Comunicar incidentes de segurança à Controladora em até 72 horas.
*   Cooperar com a Controladora para atender aos direitos dos titulares (Art. 17 a 22 da LGPD).
*   Eliminar ou devolver dados ao término do contrato, salvo obrigação legal de retenção.
*   Manter registro das operações de tratamento de dados (Art. 37 da LGPD).

### Obrigações da Controladora (Profissional de Nutrição)

A Controladora se compromete a:

*   Obter consentimento específico, informado e destacado dos titulares para o tratamento de dados sensíveis, utilizando o Termo de Consentimento do Paciente (Anexo II).
*   Fornecer à Operadora apenas dados estritamente necessários e de titulares em atendimento ativo.
*   Informar imediatamente a Operadora sobre revogação de consentimento para exclusão de dados em até 5 dias úteis.
*   Responder perante a ANPD e os titulares como Controladora, assumindo responsabilidade pelas decisões sobre finalidade e meios do tratamento.
*   Não utilizar a Plataforma para tratar dados de não-pacientes ativos.

### Subprocessadores

A Operadora utiliza subprocessadores que oferecem garantias equivalentes de proteção de dados. A inclusão de novos subprocessadores será comunicada à Controladora com 15 dias de antecedência, permitindo oposição fundamentada em 10 dias.

| Subprocessador          | Finalidade                       | Garantia                                     |
| :---------------------- | :------------------------------- | :------------------------------------------- |
| Anthropic, Inc. (Claude API) | Geração de linguagem natural (RAG) | Privacy Policy + Usage Policy (anthropic.com) |
| OpenAI, Inc.            | Embeddings semânticos (pgvector) | Data Processing Agreement (openai.com)       |
| Meta Platforms (WhatsApp Business API) | Entrega de mensagens via WhatsApp | WhatsApp Business Terms of Service (meta.com) |
| DigitalOcean, LLC       | Hospedagem de servidores e banco de dados | Data Processing Agreement (digitalocean.com) |

### Base Legal e Prazo de Retenção

As bases legais para o tratamento de dados pessoais sensíveis são:

*   **Consentimento específico e destacado do titular** (Art. 11, I da LGPD).
*   **Tutela da saúde**, sob supervisão de profissional de saúde (Art. 11, II, f da LGPD).

Os dados serão retidos pelo prazo de vigência do contrato e eliminados ou devolvidos em até 30 dias após o término, salvo obrigação legal de retenção superior.

### Responsabilidades

*   **Operadora**: Responde por danos decorrentes de descumprimento das obrigações contratuais ou tratamento em desacordo com as instruções da Controladora (Art. 42, §1º, II da LGPD).
*   **Controladora**: Responde perante os titulares e a ANPD pelas decisões sobre finalidade e meios do tratamento, incluindo a suficiência do consentimento.

### Disposições Gerais

O contrato é regido pela legislação brasileira (LGPD e Código Civil) e elege o foro da Comarca do Rio de Janeiro – RJ para dirimir controvérsias.

## 2. Termo de Consentimento Informado para Tratamento de Dados Pessoais de Saúde

Este termo é um anexo ao DPA e deve ser apresentado ao paciente ANTES do início do uso da Plataforma NutriDeby. Ele detalha como os dados pessoais de saúde serão tratados, com base no Art. 11, I da LGPD (Consentimento específico e destacado do titular).

### Quem Trata os Dados

*   **Controladora**: Nutricionista (Responsável pelo Atendimento).
*   **Operadora**: WSS+13 (WEB SMART SISTEMAS+13 LTDA), que desenvolve e opera a tecnologia NutriDeby sob instrução da nutricionista.

### Quais Dados São Tratados

São tratados dados pessoais sensíveis de saúde, incluindo:

*   **Dados cadastrais**: nome completo, data de nascimento, telefone, e-mail.
*   **Dados clínicos**: prontuário nutricional, histórico de consultas, plano alimentar, objetivos terapêuticos.
*   **Dados antropométricos**: peso, altura, IMC, medidas corporais e evolução temporal.
*   **Dados laboratoriais**: resultados de exames.
*   **Dados de interação**: mensagens trocadas via WhatsApp com o assistente inteligente.

### Para Que os Dados São Usados (Finalidades Exclusivas)

*   Personalizar comunicações do assistente inteligente.
*   Enviar lembretes, orientações e acompanhamento pós-consulta via WhatsApp.
*   Atualizar automaticamente o prontuário com informações das conversas.
*   Permitir que a nutricionista monitore a evolução do paciente.

### Como os Dados São Protegidos

*   Armazenados em banco de dados criptografado com acesso restrito.
*   Trafegam por conexões seguras (HTTPS/TLS).
*   Não são vendidos, alugados ou compartilhados para fins publicitários/comerciais.
*   Compartilhados apenas com subprocessadores essenciais (Anthropic, OpenAI, Meta, DigitalOcean) com políticas de proteção de dados.

### Direitos dos Titulares (LGPD, Arts. 17-22)

Os pacientes têm direito a:

*   Confirmação e acesso aos dados.
*   Correção de dados incompletos, inexatos ou desatualizados.
*   Eliminação de dados tratados com base no consentimento.
*   Revogação do consentimento a qualquer momento.
*   Portabilidade dos dados.

Para exercer esses direitos, o paciente deve contatar a nutricionista ou enviar e-mail para privacidade@wss13.com.br.

### Prazo de Retenção

Os dados são mantidos enquanto o paciente for ativo e por até 5 anos após o encerramento do atendimento (conforme recomendações do CFN para guarda de prontuários), ou até a revogação do consentimento.

### Declaração de Consentimento

O termo inclui uma declaração para o paciente assinar, confirmando que leu, compreendeu e consente com o tratamento de seus dados pessoais de saúde, de forma livre, informada e inequívoca.

## 3. Política de Privacidade e Proteção de Dados NutriDeby - WSS+13

Esta política detalha as práticas de privacidade e proteção de dados da WSS+13 em relação à Plataforma NutriDeby, abordando tanto seu papel como Operadora quanto como Controladora para dados específicos.

### Identificação do Controlador / Operador

*   **WSS+13 como Operadora**: Processa dados pessoais sensíveis sob instrução das nutricionistas (Controladoras).
*   **WSS+13 como Controladora**: Para dados de seus próprios clientes e usuários da plataforma (dados cadastrais e de uso).
*   **Encarregado de Dados (DPO)**: Marcos Sea - privacidade@wss13.com.br.

### Categorias de Dados Tratados

*   **Dados cadastrais das nutricionistas**: nome, CPF/CNPJ, CRN, e-mail, telefone, dados de faturamento.
*   **Dados de saúde dos pacientes**: prontuário, exames, medidas, histórico alimentar (tratados como Operadora).
*   **Dados de uso da plataforma**: logs de acesso, timestamps, volume de chamadas de API.
*   **Dados de comunicação**: conteúdo das mensagens trocadas entre o agente NutriDeby e os pacientes via WhatsApp.

### Bases Legais para o Tratamento

*   **Execução de contrato** (Art. 7º, V LGPD): para dados cadastrais das nutricionistas.
*   **Consentimento específico do titular** (Art. 11, I LGPD): para dados de saúde dos pacientes.
*   **Tutela da saúde** (Art. 11, II, f LGPD): tratamento sob supervisão de profissional de saúde.
*   **Legítimo interesse** (Art. 7º, IX LGPD): para dados de uso da plataforma (segurança, melhoria do serviço, prevenção de fraudes).

### Transferência Internacional de Dados

Dados podem ser transferidos para servidores nos EUA (Anthropic, OpenAI, DigitalOcean), com base em cláusulas contratuais padrão e políticas de proteção de dados dos fornecedores, em conformidade com o Art. 33 da LGPD.

### Segurança da Informação

A WSS+13 implementa diversas medidas de segurança:

*   Criptografia AES-256 em repouso (PostgreSQL).
*   TLS 1.2+ para dados em trânsito.
*   Autenticação por API Key com rotação periódica.
*   Controle de acesso baseado em função (RBAC) - princípio do menor privilégio.
*   Logs de auditoria de operações em dados sensíveis.
*   Backup diário com retenção de 30 dias em região geográfica separada.

### Direitos dos Titulares

Os titulares de dados (pacientes) podem exercer seus direitos da LGPD (Arts. 17 a 22) via solicitação à nutricionista (Controladora) ou diretamente à WSS+13 (privacidade@wss13.com.br), com prazo de atendimento de até 15 dias úteis.

## Conclusão

O conjunto de documentos da NutriDeby (WSS+13) demonstra um esforço abrangente para estar em conformidade com a LGPD, especialmente no que tange ao tratamento de dados pessoais sensíveis de saúde. A clareza na distinção de papéis entre Controladora e Operadora, a especificação das finalidades do tratamento, as medidas de segurança implementadas e a garantia dos direitos dos titulares são pontos fortes. A utilização de subprocessadores internacionais é devidamente justificada e amparada por cláusulas contratuais padrão, conforme exigido pela LGPD. É fundamental que as Controladoras (nutricionistas) sigam rigorosamente suas obrigações, em especial a obtenção do consentimento informado dos pacientes, para garantir a plena conformidade do ecossistema NutriDeby.
