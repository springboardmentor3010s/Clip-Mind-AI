import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import MyVideosList from "../../components/MyVideos";

function MyVideos() {
  return (
    <div className="dashboard">

      <Sidebar />

      <div className="dashboard-content">

        <DashboardNavbar />

        <div className="summary-container">

          <h1>My Videos</h1>

          <p>
            Manage all your uploaded videos.
          </p>

          <MyVideosList />

        </div>

      </div>

    </div>
  );
}

export default MyVideos;