function UploadProgress({ progress }) {

  return (

    <div className="progress-card">

      <h4>Upload Progress</h4>

      <div className="progress">

        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        >
          {progress}%
        </div>

      </div>

    </div>

  );

}

export default UploadProgress;
