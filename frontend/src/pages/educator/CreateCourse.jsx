import { useState } from "react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function CreateCourse(){

    const [form,setForm]=useState({

        title:"",

        description:"",

        category:"",

        difficulty:"",

        thumbnail:""

    });

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange=(e)=>{

        setForm({

            ...form,

            [e.target.name]:e.target.value

        });

    };

    const createCourse=async()=>{

        if (
            !form.title ||
            !form.description ||
            !form.category ||
            !form.difficulty
        ) {
            alert("Please fill all required fields.");
            return;
        }

        setLoading(true);

        try{

            await api.post(
                "/educator/course",
                form,
                {
                    params: {
                        educator_id: localStorage.getItem("user_id")
                    }
                }
            );

            alert("Course Created Successfully");

            navigate("/educator/my-courses");

        }

        catch(err){

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to create course."
            );

        }

        finally {

            setLoading(false);

        }

    };

    return(

        <DashboardLayout role="educator">

            <h1 className="page-title">Create Course</h1>

<div className="course-form">

    <input
        name="title"
        placeholder="Course Title"
        value={form.title}
        onChange={handleChange}
    />

    <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
    />

    <input
        name="category"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
    />

    <input
        name="difficulty"
        placeholder="Difficulty"
        value={form.difficulty}
        onChange={handleChange}
    />

    <input
        name="thumbnail"
        placeholder="Thumbnail URL"
        value={form.thumbnail}
        onChange={handleChange}
    />

    <button
        className="create-course-btn"
        onClick={createCourse}
        disabled={loading}
    >
        {loading ? "Creating..." : "Create Course"}
    </button>

</div>
        </DashboardLayout>

    );

}

export default CreateCourse;