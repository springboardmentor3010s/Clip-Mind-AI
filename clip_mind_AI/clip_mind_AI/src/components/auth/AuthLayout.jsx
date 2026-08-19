function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <div className="w-full max-w-7xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-2">

        {/* Left Section */}

        <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">

          <h1 className="text-5xl font-extrabold leading-tight">
            Create your
            <br />
            AI Workspace
          </h1>

          <p className="mt-6 text-lg text-blue-100 leading-8">
            Upload videos, generate transcripts, create AI summaries,
            and detect key moments — all in one place.
          </p>

          <div className="mt-12">

            <div className="flex items-center gap-4 mb-6">

              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                🎥
              </div>

              <span className="text-lg">
                Upload Videos
              </span>

            </div>

            <div className="flex items-center gap-4 mb-6">

              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                🤖
              </div>

              <span className="text-lg">
                AI Summaries
              </span>

            </div>

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                ⚡
              </div>

              <span className="text-lg">
                Smart Highlights
              </span>

            </div>

          </div>

        </div>

        {/* Right Section */}

        <div className="bg-white p-10 lg:p-16">

          <h2 className="text-4xl font-bold text-gray-900">
            {title}
          </h2>

          <p className="text-gray-500 mt-3">
            {subtitle}
          </p>

          <div className="mt-10">

            {children}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthLayout;