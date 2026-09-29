import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/Badge";

// Badge status otomatis dari 4 syarat — bukan input manual
export function CompletionStatus({ complete }) {
  return complete ? (
    <Badge tone="emerald">
      <CheckCircle2 size={11} /> Lengkap
    </Badge>
  ) : (
    <Badge tone="amber">
      <AlertTriangle size={11} /> Belum Lengkap
    </Badge>
  );
}
export default CompletionStatus;
