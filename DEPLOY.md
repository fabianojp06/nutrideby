# Deploy na Vercel — apps/pwa-patient e apps/admin-web

Este é um monorepo sem workspace unificado (cada app tem seu próprio `package.json`), então cada app vira um **Projeto Vercel separado**, apontando para uma subpasta via "Root Directory".

## Pré-requisito
```
npm i -g vercel
vercel login
```

## 1. Deploy do PWA Paciente (`apps/pwa-patient`)

Via CLI (mais simples):
```bash
cd apps/pwa-patient
vercel
```
Ao rodar pela primeira vez, o CLI pergunta:
- **Set up and deploy?** → Yes
- **Link to existing project?** → No (crie um novo, ex: `nutrideby-pwa-patient`)
- **Root Directory** → já está correto por rodar dentro da pasta
- Framework detectado: Vite (usa automaticamente `npm run build` → `dist/`, já configurado em `vercel.json`)

Depois do primeiro deploy, para produção:
```bash
vercel --prod
```

**Via Dashboard (vercel.com)**: New Project → importar o repositório → em "Root Directory" selecionar `apps/pwa-patient` → Framework: Vite → Deploy.

`vercel.json` já criado nessa pasta cobre:
- Rewrite de todas as rotas para `index.html` (necessário para o React Router funcionar em navegação direta por URL)
- Headers corretos para o service worker (`sw.js`) e manifest da PWA

## 2. Deploy do Admin Web (`apps/admin-web`)

```bash
cd apps/admin-web
vercel
```
- **Root Directory** → pasta atual
- Framework detectado automaticamente: Next.js (não precisa de `vercel.json`, a Vercel já sabe buildar Next.js nativamente)

```bash
vercel --prod
```

**Via Dashboard**: mesmo fluxo, Root Directory = `apps/admin-web`, Framework: Next.js.

## 3. Testar pelo celular
Após qualquer um dos deploys, a Vercel retorna uma URL pública (`https://<projeto>.vercel.app`). Basta abrir essa URL no navegador do celular — para o PWA Paciente, o navegador vai oferecer "Adicionar à tela inicial" automaticamente (ou pelo menu do navegador), simulando a instalação do app.

## Observações importantes
- **Sem backend real ainda**: ambos os apps hoje consomem dados mockados (`mockApi.ts` no PWA, `lib/api.ts` no admin-web). O deploy vai funcionar visualmente, mas nada será persistido de verdade até o `api-gateway` também estar hospedado e as chamadas serem trocadas dos mocks para a API real.
- **Ícones placeholder**: o PWA tem ícones 1x1 provisórios (`public/icons/`) — substituir por artes reais antes de divulgar.
- **Variáveis de ambiente**: nenhum app precisa de env vars para rodar no estado atual (tudo mockado). Quando plugar no backend real, configurar `NEXT_PUBLIC_API_URL` (admin-web) e `VITE_API_URL` (pwa-patient) no dashboard da Vercel.
