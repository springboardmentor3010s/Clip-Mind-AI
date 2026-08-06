import Footer from "../components/Footer";
import HomeNavbar from "../components/HomeNavbar";

function Home() {
  return (
    <>

      <HomeNavbar />

      <section className="hero">

        <h1>

          AI Video Summarization Platform

        </h1>

        <p>

          Upload videos, generate transcripts,
          create AI summaries,
          and detect key moments instantly.

        </p>

        <div className="hero-buttons">

          <button className="primary-btn">
            Get Started
          </button>

          <button className="secondary-btn">
            Learn More
          </button>

        </div>

      </section>

      <section
        className="features"
        id="features"
      >

        <h2>

          Features

        </h2>

        <div className="feature-grid">

          <div className="card">

            📹

            <h3>Video Upload</h3>

            <p>
              Upload videos securely.
            </p>

          </div>

          <div className="card">

            🤖

            <h3>AI Summary</h3>

            <p>
              Generate concise summaries.
            </p>

          </div>

          <div className="card">

            🎤

            <h3>Transcript</h3>

            <p>
              Speech to text using Whisper.
            </p>

          </div>

          <div className="card">

            ⭐

            <h3>Key Moments</h3>

            <p>
              Detect important timestamps.
            </p>

          </div>

        </div>

      </section>

      

      <Footer />

    </>
  );
}

export default Home;