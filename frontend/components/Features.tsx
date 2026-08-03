export default function Features() {
  const features = [
    {
      title: "Speech to Text",
      desc: "Convert videos into accurate transcripts.",
      icon: "🎤",
    },
    {
      title: "AI Summary",
      desc: "Generate short summaries instantly.",
      icon: "📝",
    },
    {
      title: "Key Moments",
      desc: "Find the most important highlights.",
      icon: "⭐",
    },
    {
      title: "Analytics",
      desc: "Track views, engagement and insights.",
      icon: "📊",
    },
  ];

  return (
    <section
      style={{
        background: "#111827",
        color: "white",
        padding: "80px 60px",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "42px",
          marginBottom: "60px",
        }}
      >
        Powerful Features
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "30px",
        }}
      >
        {features.map((item, index) => (
          <div
            key={index}
            style={{
              background: "#1e293b",
              padding: "30px",
              borderRadius: "16px",
            }}
          >
            <h1>{item.icon}</h1>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}