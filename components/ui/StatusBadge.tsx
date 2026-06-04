export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cls = key === "approved" ? "badge-approved" : key === "rejected" ? "badge-rejected" : "badge-pending";
  return <span className={`badge ${cls}`}>{status}</span>;
}
