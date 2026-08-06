function ProcessingStatus() {

  return (

    <div className="processing-status">

      <h2>AI Processing Queue</h2>

      <br />

      <p>🎥 Audio Extraction</p>

      <progress value="100" max="100"></progress>

      <br /><br />

      <p>🎤 Speech to Text</p>

      <progress value="80" max="100"></progress>

      <br /><br />

      <p>🤖 Summary Generation</p>

      <progress value="60" max="100"></progress>

      <br /><br />

      <p>⭐ Key Moments</p>

      <progress value="30" max="100"></progress>

    </div>

  );

}

export default ProcessingStatus;