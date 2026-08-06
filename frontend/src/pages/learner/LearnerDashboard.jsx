import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import StatCard from "../../components/StatCard";

function LearnerDashboard() {

  return (

    <div className="dashboard">

      <Sidebar role="learner" />

      <div className="dashboard-content">

        <DashboardNavbar />

        <div className="dashboard-body">

          <h1>Welcome, Learner 👋</h1>

          <p>
            Continue your learning journey.
          </p>

          <div className="stats-grid">

            <StatCard
              title="Courses"
              value="8"
              color="#2563eb"
            />

            <StatCard
              title="Videos"
              value="42"
              color="#16a34a"
            />

            <StatCard
              title="Bookmarks"
              value="15"
              color="#9333ea"
            />

            <StatCard
              title="Progress"
              value="76%"
              color="#f97316"
            />

          </div>

          <div className="summary-card">

            <h2>Continue Watching</h2>

            <ul>
              <li>AI Introduction</li>
              <li>Machine Learning</li>
              <li>Neural Networks</li>
            </ul>

          </div>

          <div className="summary-card">

            <h2>Recommended Videos</h2>

            <ul>
              <li>Computer Vision</li>
              <li>Natural Language Processing</li>
              <li>Generative AI</li>
            </ul>

          </div>

        </div>

      </div>

    </div>

  );

}

export default LearnerDashboard;