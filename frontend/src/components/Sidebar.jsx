import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUpload,
  FaFileAlt,
  FaBrain,
  FaClock,
  FaChartBar,
  FaUser,
  FaUserShield,
  FaSignOutAlt,
  FaVideo,     // 🟢 Video Library & My Videos / Content Management
  FaBookmark,  // 🟢 Bookmarks
  FaBook,      // 🟢 Learning Materials
  FaUsers,     // 🛡️ Admin: User Management
  FaRobot,     // 🛡️ Admin: AI Processing Jobs
  FaHdd,       // 🛡️ Admin: Storage & Resources
  FaShieldAlt, // 🛡️ Admin: Audit Logs
  FaCogs,      // 🛡️ Admin: Platform Settings
} from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Role detection with fallbacks
  const userRole =
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    "Learner";

  const isAdmin = userRole.toLowerCase() === "administrator";
  const isEducator = userRole.toLowerCase() === "educator";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const menuStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    marginBottom: "12px",
    textDecoration: "none",
    borderRadius: "10px",
    background: location.pathname === path ? "#2563eb" : "transparent",
    color: location.pathname === path ? "#ffffff" : "#374151",
    fontWeight: "600",
    transition: "0.3s",
  });

  // 1. Standard Role-Based Menu Items (For Learner, Educator, Content Creator)
  const standardMenuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <FaHome />,
      roles: ["Learner", "Educator", "Content Creator"],
    },
    {
      path: "/my-videos",
      label: "My Videos",
      icon: <FaVideo />,
      roles: ["Content Creator"],
    },
    {
      path: "/library",
      label: "Video Library",
      icon: <FaVideo />,
      roles: ["Learner"],
    },
    {
      path: "/upload",
      label: "Upload Video",
      icon: <FaUpload />,
      roles: ["Educator", "Content Creator"],
    },
    {
      path: "/transcript",
      label: "Transcript",
      icon: <FaFileAlt />,
      roles: ["Learner", "Educator", "Content Creator"],
    },
    {
      path: "/summary",
      label: "AI Summary",
      icon: <FaBrain />,
      roles: ["Learner", "Educator", "Content Creator"],
    },
    {
      path: "/learning-materials",
      label: "Learning Materials",
      icon: <FaBook />,
      roles: ["Learner", "Educator"], // 🟢 Content Creator நீக்கப்பட்டு Learner & Educator-க்கு மட்டும்
    },
    {
      path: "/keymoments",
      label: "Key Moments",
      icon: <FaClock />,
      roles: ["Learner", "Educator", "Content Creator"],
    },
    {
      path: "/bookmarks",
      label: "My Bookmarks",
      icon: <FaBookmark />,
      roles: ["Learner"],
    },
    {
      path: "/analytics",
      label: isEducator ? "Classroom Content Analytics" : "Analytics", // 🟢 Educator-க்கு பிரத்யேக பெயர்
      icon: <FaChartBar />,
      roles: ["Educator", "Content Creator"],
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <FaUser />,
      roles: ["Learner", "Educator", "Content Creator"],
    },
  ];

  // 2. 🛡️ Dedicated Administrator Menu Structure (Monitoring & Governance)
  const adminMenuItems = [
    {
      path: "/admin-panel",
      label: "Dashboard",
      icon: <FaHome />,
    },
    {
      path: "/admin-panel?tab=users",
      label: "User Management",
      icon: <FaUsers />,
    },
    {
      path: "/admin-panel?tab=content",
      label: "Content Management",
      icon: <FaVideo />,
    },
    {
      path: "/admin-panel?tab=jobs",
      label: "AI Processing Jobs",
      icon: <FaRobot />,
    },
    {
      path: "/admin-panel?tab=analytics",
      label: "System Analytics",
      icon: <FaChartBar />,
    },
    {
      path: "/admin-panel?tab=storage",
      label: "Storage & Resources",
      icon: <FaHdd />,
    },
    {
      path: "/admin-panel?tab=audit",
      label: "Audit Logs",
      icon: <FaShieldAlt />,
    },
    {
      path: "/admin-panel?tab=settings",
      label: "Platform Settings",
      icon: <FaCogs />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <FaUser />,
    },
  ];

  return (
    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "25px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "2px 0 10px rgba(0,0,0,.05)",
      }}
    >
      <div>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "#2563eb", margin: 0 }}>ClipMind AI</h2>
          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: isAdmin ? "#fee2e2" : "#dbeafe",
              color: isAdmin ? "#991b1b" : "#1e40af",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {userRole} Mode
          </span>
        </div>

        {/* Render Administrator Menu if Admin, else render Standard User Roles Menu */}
        {isAdmin
          ? adminMenuItems.map((item) => {
              const isActive =
                item.path.includes("?")
                  ? location.pathname + location.search === item.path
                  : location.pathname === item.path && !location.search;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...menuStyle(item.path),
                    background: isActive ? "#2563eb" : "transparent",
                    color: isActive ? "#ffffff" : "#374151",
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })
          : standardMenuItems.map((item) => {
              const hasPermission = item.roles.some(
                (r) => r.toLowerCase() === userRole.toLowerCase()
              );

              if (!hasPermission) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={menuStyle(item.path)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
      </div>

      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "10px",
          background: "#ef4444",
          color: "#ffffff",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );
}

export default Sidebar;