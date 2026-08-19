function HowItWorks() {
  const steps = [
    {
      no: "01",
      title: "Upload Video",
      desc: "Upload any MP4, AVI or MOV video securely."
    },
    {
      no: "02",
      title: "Speech To Text",
      desc: "Whisper AI converts speech into accurate transcripts."
    },
    {
      no: "03",
      title: "AI Summary",
      desc: "Generate concise summaries using NLP models."
    },
    {
      no: "04",
      title: "Key Moments",
      desc: "Automatically detect important highlights."
    },
  ];

  return (
    <section className="bg-slate-950 py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-5xl font-bold text-center">
          How It Works
        </h2>

        <p className="text-gray-400 text-center mt-4 mb-16">
          Just four simple steps to process your videos with AI.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {steps.map((step) => (
            <div
              key={step.no}
              className="bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition"
            >
              <span className="text-blue-500 text-5xl font-bold">
                {step.no}
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                {step.title}
              </h3>

              <p className="mt-4 text-gray-400">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;