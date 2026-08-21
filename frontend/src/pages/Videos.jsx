export default function Videos({ videoURL }) {

  return (

    <div className="card shadow-sm p-3">

      <h4>🎥 Video Player</h4>

      <video
        controls
        width="100%"
        style={{borderRadius:"12px"}}
      >

        <source
          src={videoURL}
          type="video/mp4"
        />

      </video>

    </div>

  );

}
