type Props = {
  title: string;
  value: string;
  icon: string;
};

export default function DashboardCard({
  title,
  value,
  icon,
}: Props) {
  return (
    <div
      style={{
        background: "#1E293B",
        padding: "25px",
        borderRadius: "18px",
        color: "white",
        boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        transition: "0.3s",
      }}
    >
      <div
        style={{
          fontSize: "35px",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          color: "#CBD5E1",
          marginBottom: "12px",
        }}
      >
        {title}
      </h3>

      <h1
        style={{
          color: "#38BDF8",
          fontSize: "34px",
          margin: 0,
        }}
      >
        {value}
      </h1>
    </div>
  );
}