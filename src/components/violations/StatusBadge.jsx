import { Badge } from "../ui/Badge";
import {
  VIOLATION_STATUS_LABELS,
  REPORT_STATUS_LABELS,
} from "../../lib/constants";

const VTONE = {
  active: "amber",
  reported: "sky",
  under_review: "violet",
  confirmed: "rose",
  revoked: "emerald",
};
const RTONE = {
  pending: "amber",
  reviewing: "sky",
  accepted: "emerald",
  rejected: "rose",
};

export function ViolationStatusBadge({ status }) {
  return (
    <Badge tone={VTONE[status] ?? "neutral"}>
      {VIOLATION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
export function ReportStatusBadge({ status }) {
  return (
    <Badge tone={RTONE[status] ?? "neutral"}>
      {REPORT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
