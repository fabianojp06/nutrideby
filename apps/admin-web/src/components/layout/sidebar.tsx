"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { nutricionistaAtual } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard", label: "Pacientes", icon: Users },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-brand-900 text-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <Leaf className="h-6 w-6 text-brand-200" />
        <span className="text-lg font-semibold">NutriDeby</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand-100 hover:bg-brand-800",
            pathname === "/dashboard" && "bg-brand-800 text-white"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand-100 hover:bg-brand-800",
                active && "bg-brand-800 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-800 px-4 py-4">
        <p className="text-sm font-medium">{nutricionistaAtual.nome}</p>
        <p className="text-xs text-brand-200">{nutricionistaAtual.crn}</p>
      </div>
    </aside>
  );
}
