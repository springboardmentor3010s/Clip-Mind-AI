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
} from "react-icons/fa";

function Sidebar({ role = "creator" }) {

  const menus = {

    creator: [
      { name: "Dashboard", icon: <FaHome />, path: "/creator-dashboard" },
      { name: "Upload Video", icon: <FaUpload />, path: "/upload-content" },
      { name: "My Videos", icon: <FaVideo />, path: "/creator/videos" },
      { name:"Profile",icon:<FaUser/>,path:"/creator/profile"}
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
    name: "Learning Materials",
    icon: <FaBook />,
    path: "/educator/materials"
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

    

    admin: [
      { name: "Dashboard", icon: <FaHome />, path: "/admin-dashboard" },
      { name: "Users", icon: <FaUsers />, path: "#" },
      { name: "Videos", icon: <FaVideo />, path: "#" },
      { name: "Reports", icon: <FaChartBar />, path: "#" },
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