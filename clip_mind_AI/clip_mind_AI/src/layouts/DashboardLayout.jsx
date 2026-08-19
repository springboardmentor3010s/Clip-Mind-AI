import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import TopNavbar from "../components/dashboard/TopNavbar";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      <Sidebar />

      <div className="flex-1">

        <TopNavbar />

        <div className="p-8">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default DashboardLayout;