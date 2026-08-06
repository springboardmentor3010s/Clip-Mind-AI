import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function EditCourse() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [title,setTitle]=useState("");

    const [description,setDescription]=useState("");

    const [loading, setLoading] = useState(false);

    useEffect(()=>{

        fetchCourse();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[id]);

    const fetchCourse=async()=>{

        try {

            const res = await api.get(`/educator/course/${id}`);

            setTitle(res.data.title);

            setDescription(res.data.description);

        } catch (err) {

            console.error(err);

            alert("Unable to load course.");

        }

    };

    const handleUpdate=async()=>{

        setLoading(true);

        try {

            await api.put(`/educator/course/${id}`,{

                title,

                description

            });

            alert("Updated Successfully");

            navigate("/educator/my-courses");

        } catch (err) {

            console.error(err);

            alert("Unable to update course.");

        } finally {

            setLoading(false);

        }

    };

    return(

        <DashboardLayout role="educator">

            <h1>Edit Course</h1>

            <input
            className="upload-input"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            />

            <textarea
            className="upload-textarea"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            />

            <button
            className="upload-btn"
            onClick={handleUpdate}
            disabled={loading}
            >

                {loading ? "Updating..." : "Update Course"}

            </button>

        </DashboardLayout>

    );

}

export default EditCourse;