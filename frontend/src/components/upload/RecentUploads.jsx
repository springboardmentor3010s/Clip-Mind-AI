function RecentUploads() {

  const uploads = [

    {
      name: "MachineLearning.mp4",
      status: "Completed",
    },

    {
      name: "AI_Tutorial.mp4",
      status: "Processing",
    },

  ];

  return (

    <div className="recent-upload-card">

      <h3>Recent Uploads</h3>

      {uploads.map((video, index) => (

        <div
          className="upload-item"
          key={index}
        >

          <span>🎥 {video.name}</span>

          <span>{video.status}</span>

        </div>

      ))}

    </div>

  );

}

export default RecentUploads;
