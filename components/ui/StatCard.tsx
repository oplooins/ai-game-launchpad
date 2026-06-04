export function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div className="card"><p className="muted" style={{ margin: 0 }}>{label}</p><p className="stat-number">{value}</p></div>;
}
