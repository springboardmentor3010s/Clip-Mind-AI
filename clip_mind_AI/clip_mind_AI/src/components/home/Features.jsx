function Features() {
  const features = [
    {
      title: "AI Video Summarization",
      desc: "Generate short and meaningful summaries from long videos."
    },
    {
      title: "Speech to Text",
      desc: "Convert video audio into accurate transcripts using AI."
    },
    {
      title: "Key Moment Detection",
      desc: "Automatically detect the most important moments."
    },
    {
      title: "Analytics Dashboard",
      desc: "View uploads, summaries, transcripts and reports."
    }
  ];

  return (
    <section className="bg-slate-900 py-24 px-6">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-5xl font-bold text-center mb-5">
          Powerful Features
        </h2>

        <p className="text-center text-gray-400 mb-16">
          Everything you need for AI-powered video processing.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {features.map((item, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-2xl p-8 hover:bg-slate-700 transition"
            >
              <h3 className="text-2xl font-bold mb-4">
                {item.title}
              </h3>

              <p className="text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Features;