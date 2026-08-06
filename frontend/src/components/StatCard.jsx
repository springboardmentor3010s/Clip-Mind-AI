function StatCard({ title, value, color }) {
  return (
    <div className="stat-card">

      <p>{title}</p>

      <h2 style={{ color }}>{value}</h2>

    </div>
  );
}

export default StatCard;