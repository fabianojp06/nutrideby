import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "nutrideby_admin_token";

// Protege as rotas autenticadas do dashboard. Sem token (cookie httpOnly
// gravado no login), redireciona para /login. A autorização real (papel
// NUTRICIONISTA, dono do recurso) é sempre revalidada no gateway — aqui é só
// um gate de navegação para não renderizar telas que dependem do token.
const ROTAS_PROTEGIDAS = ["/dashboard", "/pacientes", "/planos", "/assinatura"];

// Decodifica o `exp` (epoch em segundos) do payload do JWT SEM verificar a
// assinatura — o middleware roda no Edge (sem o segredo do gateway) e não
// precisa validar o token, só evitar renderizar uma tela que vai falhar com
// 401 por sessão expirada. A validação real continua no gateway. Retorna null
// quando não dá para determinar (token malformado, sem exp) — nesse caso NÃO
// forçamos logout (evita falso positivo); a rede de segurança do AppShell
// cobre um 401 que escape daqui.
function expDoToken(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function redirecionarParaLogin(req: NextRequest, limparCookie: boolean) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const res = NextResponse.redirect(url);
  // Cookie expirado/inválido: remove para não ficar reciclando o mesmo 401.
  if (limparCookie) res.cookies.delete(TOKEN_COOKIE);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  if (!protegida) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return redirecionarParaLogin(req, false);
  }

  // Token presente mas com `exp` no passado: sessão expirada. Manda para o
  // login (limpando o cookie) ANTES de renderizar, em vez de deixar o Server
  // Component quebrar com 401 e cair no boundary genérico "Algo deu errado".
  const exp = expDoToken(token);
  if (exp !== null && exp * 1000 <= Date.now()) {
    return redirecionarParaLogin(req, true);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pacientes/:path*", "/planos/:path*", "/assinatura/:path*"],
};
