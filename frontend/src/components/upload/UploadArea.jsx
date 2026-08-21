import { useRef } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

function UploadArea({ setFile }) {

  const fileInput = useRef();

  const handleBrowse = () => {
    fileInput.current.click();
  };

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="upload-box">

      <FaCloudUploadAlt className="upload-icon" />

      <h2>Drag & Drop your Video</h2>

      <p>
        Supported formats:
        MP4 • AVI • MOV • MKV
      </p>

      <button
        className="browse-btn"
        onClick={handleBrowse}
      >
        Browse Files
      </button>

      <input
        type="file"
        hidden
        accept="video/*"
        ref={fileInput}
        onChange={handleChange}
      />

    </div>
  );
}

export default UploadArea;
