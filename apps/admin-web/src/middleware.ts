import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "nutrideby_admin_token";

// Protege as rotas autenticadas do dashboard. Sem token (cookie httpOnly
// gravado no login), redireciona para /login. A autorização real (papel
// NUTRICIONISTA, dono do recurso) é sempre revalidada no gateway — aqui é só
// um gate de navegação para não renderizar telas que dependem do token.
const ROTAS_PROTEGIDAS = ["/dashboard", "/pacientes", "/planos", "/assinatura"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  if (!protegida) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pacientes/:path*", "/planos/:path*", "/assinatura/:path*"],
};
