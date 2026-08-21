import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatsCards from "../components/dashboard/StatsCards";
import RecentVideos from "../components/dashboard/RecentVideos";

function Dashboard() {

  return (

    <div
      style={{
        display: "flex",
        background: "#020617",
        minHeight: "100vh",
      }}
    >

      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "35px",
        }}
      >

        <Topbar />

        <StatsCards />

        <RecentVideos />

      </div>

    </div>

  );

}

export default Dashboard;
