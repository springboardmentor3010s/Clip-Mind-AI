import Sidebar from "./Sidebar";
import DashboardNavbar from "./DashboardNavbar";

function DashboardLayout({ role, children }) {

  return (

    <div className="dashboard">

      <Sidebar role={role} />

      <div className="dashboard-content">

        <DashboardNavbar />

        <div className="dashboard-body">

          {children}

        </div>

      </div>

    </div>

  );

}

export default DashboardLayout;