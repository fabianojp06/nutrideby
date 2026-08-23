import { Badge } from "@/components/ui/badge";
import { StatusPaciente } from "@/types";

const config: Record<StatusPaciente, { label: string; variant: "success" | "warning" | "outline" }> = {
  ativo: { label: "Ativo", variant: "success" },
  aguardando_consentimento: { label: "Aguardando consentimento", variant: "warning" },
  inativo: { label: "Inativo", variant: "outline" },
};

export function StatusBadge({ status }: { status: StatusPaciente }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
