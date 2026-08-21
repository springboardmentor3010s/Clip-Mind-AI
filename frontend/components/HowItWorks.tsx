export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload Video",
      desc: "Upload any MP4, AVI or MOV file securely."
    },
    {
      number: "02",
      title: "Speech To Text",
      desc: "Whisper AI converts speech into accurate transcripts."
    },
    {
      number: "03",
      title: "AI Summary",
      desc: "Generate concise summaries using NLP models."
    },
    {
      number: "04",
      title: "Key Moments",
      desc: "Automatically detect important highlights."
    }
  ];

  return (
<section
  style={{
        background: "#0f172a",
        color: "white",
        padding: "80px 60px"
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "42px",
          marginBottom: "10px"
        }}
      >
        How It Works
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#94a3b8",
          marginBottom: "50px"
        }}
      >
        Just four simple steps to process your videos with AI.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "25px"
        }}
      >
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              background: "#1e293b",
              borderRadius: "18px",
              padding: "30px"
            }}
          >
            <h1
              style={{
                color: "#38bdf8",
                fontSize: "45px",
                marginBottom: "20px"
              }}
            >
              {step.number}
            </h1>

            <h3>{step.title}</h3>

            <p
              style={{
                color: "#cbd5e1",
                marginTop: "15px"
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}