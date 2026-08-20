import { useLocation } from "react-router-dom";


function DashboardNavbar() {

    const fullName =
        localStorage.getItem("full_name") ||
        "User";

    const location = useLocation();


    const pageTitle = location.pathname
        .split("/")
        .pop()
        .replaceAll("-", " ");


    return (

        <div className="top-navbar">

            <div className="navbar-spacer">
            </div>


            <div className="user-info">

                <span className="user-greeting">

                    Hello, {fullName} 👋

                </span>

            </div>

        </div>

    );

}


export default DashboardNavbar;