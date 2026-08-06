import { useLocation } from "react-router-dom";

function DashboardNavbar() {

    const fullName = localStorage.getItem("full_name");

    const location = useLocation();

    const pageTitle = location.pathname
        .split("/")
        .pop()
        .replace("-", " ");

    return (

        <div className="top-navbar">

            

            <div className="user-info">

                <span>

                    Hello, {fullName} 👋

                </span>

            </div>

        </div>

    );

}

export default DashboardNavbar;