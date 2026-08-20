import { Link } from "react-router-dom";
import {
  FaHome,
  FaUpload,
  FaVideo,
  FaBook,
  FaUsers,
  FaChartBar,
  FaUser,
  FaSignOutAlt,
  FaFileAlt,
  FaSignInAlt,
  FaHistory,
  FaBookmark,
  FaTasks,
  FaDatabase,
  FaClipboardList,
  FaCog,
} from "react-icons/fa";

function Sidebar({ role = "creator" }) {

  const menus = {

    creator: [
      { name: "Dashboard", icon: <FaHome />, path: "/creator-dashboard" },
      { name: "Upload Video", icon: <FaUpload />, path: "/upload-content" },
      { name: "My Videos", icon: <FaVideo />, path: "/creator/videos" },
      { name:"Profile",icon:<FaUser/>,path:"/creator/profile"},
      {name: "Upload History", icon: <FaHistory />, path: "/creator/upload-history"}
    ],

    educator: [

{
    name: "Dashboard",
    icon: <FaHome />,
    path: "/educator-dashboard"
},

{
    name: "Create Course",
    icon: <FaBook />,
    path: "/educator/create-course"
},

{
    name: "My Courses",
    icon: <FaVideo />,
    path: "/educator/my-courses"
},

{
    name: "Upload Lecture",
    icon: <FaUpload />,
    path: "/educator/upload-lecture"
},

{
    name: "My Lectures",
    path: "/educator/lectures",
    icon: <FaVideo />
},

{
    name: "Classrooms",
    path: "/educator/classrooms",
    icon: <FaUsers />
},



{
    name: "Transcripts",
    icon: <FaFileAlt />,
    path: "/educator/transcripts"
},
{
    name: "Summaries",
    icon: <FaFileAlt />,
    path: "/educator/summaries"
},

{
    name: "Analytics",
    icon: <FaChartBar />,
    path: "/educator/analytics"
},

{
    name: "Student Engagement",
    icon: <FaUsers />,
    path: "/educator/engagement"
},

{
    name: "Profile",
    icon: <FaUser />,
    path: "/educator/profile"
}

],

    learner: [

{
    name: "Dashboard",
    icon: <FaHome />,
    path: "/learner-dashboard"
},

{
    name: "All Videos",
    icon: <FaVideo />,
    path: "/learner/videos"
},

{
    name: "Courses",
    icon: <FaBook />,
    path: "/learner/courses"
},

{
    name: "My Classrooms",
    icon: <FaUsers />,
    path: "/learner/classrooms"
},

{
    name: "Join Classroom",
    icon: <FaSignInAlt />,
    path: "/learner/join-classroom"
},

{
    name: "Learning History",
    icon: <FaHistory />,
    path: "/learner/history"
},

{
    name: "Bookmarks",
    icon: <FaBookmark />,
    path: "/learner/bookmarks"
},

{
    name: "Profile",
    icon: <FaUser />,
    path: "/learner/profile"
}

],

    

    admin: [

{
    name: "Dashboard",
    icon: <FaHome />,
    path: "/admin-dashboard"
},

{
    name: "Users",
    icon: <FaUsers />,
    path: "/admin/users"
},

{
    name: "Content",
    icon: <FaFileAlt />,
    path: "/admin/content"
},

{
    name: "Analytics",
    icon: <FaChartBar />,
    path: "/admin/analytics"
},

{
    name: "Processing Jobs",
    icon: <FaTasks />,
    path: "/admin/processing"
},

{
    name: "Storage",
    icon: <FaDatabase />,
    path: "/admin/storage"
},

{
    name: "Audit Logs",
    icon: <FaClipboardList />,
    path: "/admin/audit-logs"
},

{
    name: "Settings",
    icon: <FaCog />,
    path: "/admin/settings"
}

],

  };

  return (

    <div className="sidebar">

      <div className="sidebar-logo">

        ClipMind AI

      </div>

      <ul>

        {menus[role].map((item, index) => (

          <li key={index}>

            <Link to={item.path}>

              {item.icon}

              {" "}

              {item.name}

            </Link>

          </li>

        ))}

        <li>

  <button
    className="logout-btn"
    onClick={() => {

      localStorage.clear();

      window.location.href="/";

    }}
  >

    <FaSignOutAlt />

    {" "}

    Logout

  </button>

</li>

      </ul>

    </div>

  );

}

export default Sidebar;