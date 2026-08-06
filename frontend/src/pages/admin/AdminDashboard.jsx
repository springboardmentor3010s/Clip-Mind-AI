import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import StatCard from "../../components/StatCard";

function AdminDashboard() {

  return (

    <div className="dashboard">

      <Sidebar role="admin" />

      <div className="dashboard-content">

        <DashboardNavbar />

        <div className="dashboard-body">

          <h1>Welcome, Administrator 👋</h1>

          <p>
            Monitor platform activity and manage users.
          </p>

          <div className="stats-grid">

            <StatCard
              title="Users"
              value="1024"
              color="#2563eb"
            />

            <StatCard
              title="Videos"
              value="547"
              color="#16a34a"
            />

            <StatCard
              title="Storage"
              value="1.8 TB"
              color="#9333ea"
            />

            <StatCard
              title="Reports"
              value="9"
              color="#f97316"
            />

          </div>

          <div className="summary-card">

            <h2>Recent Users</h2>

            <ul>
              <li>Sathwik</li>
              <li>Rahul</li>
              <li>Ananya</li>
            </ul>

          </div>

          <div className="summary-card">

            <h2>Recent Uploads</h2>

            <ul>
              <li>AI Introduction.mp4</li>
              <li>Deep Learning.mp4</li>
              <li>Neural Networks.mp4</li>
            </ul>

          </div>

        </div>

      </div>

    </div>

  );

}

export default AdminDashboard;