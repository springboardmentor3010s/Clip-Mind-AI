import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Courses() {

  const [courses, setCourses] = useState([]);

  useEffect(() => {

    fetchCourses();

  }, []);

  const fetchCourses = async () => {

    try {

      const res = await api.get("/educator/courses");

      setCourses(res.data);

    }

    catch(err){

      console.log(err);

    }

  };

  return (

    <DashboardLayout role="educator">

      <h1>My Courses</h1>

      <div
className="video-buttons"
style={{marginBottom:"20px"}}
>

<button
onClick={()=>window.location.href="/educator/create-course"}
>

+ Create Course

</button>

</div>

      {

        courses.length===0

        ?

        <p>No Courses Found.</p>

        :

        courses.map((course)=>(

          <div
            className="video-card"
            key={course.id}
          >

            <h2>{course.title}</h2>

            <p>{course.description}</p>

            <p>

              <strong>

                Educator ID:

              </strong>

              {" "}

              {course.educator_id}

            </p>

            <div className="video-buttons">

              <button
onClick={()=>
window.location.href=`/educator/edit-course/${course.id}`
}
>

Edit

</button>

              <button
onClick={async()=>{

await api.delete(`/educator/courses/${course.id}`);

fetchCourses();

}}
>

Delete

</button>

            </div>

          </div>

        ))

      }

    </DashboardLayout>

  );

}

export default Courses;