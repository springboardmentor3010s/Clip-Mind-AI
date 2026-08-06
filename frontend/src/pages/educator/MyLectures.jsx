import DashboardLayout from "../../components/DashboardLayout";
import MyVideos from "../../components/MyVideos";
import api from "../../api/axios";

function MyLectures() {

    const shareLecture = async (videoId) => {

        try {

            const educatorId = localStorage.getItem("user_id");

            await api.post(
                `/educator/share/${videoId}?educator_id=${educatorId}`
            );

            alert("Lecture Shared Successfully");

        } catch (err) {

            console.log(err);
            alert("Failed to Share Lecture");

        }

    };

    return (

        <DashboardLayout role="educator">

            <h1>My Lectures</h1>

            <MyVideos onShare={shareLecture} />

        </DashboardLayout>

    );

}

export default MyLectures;