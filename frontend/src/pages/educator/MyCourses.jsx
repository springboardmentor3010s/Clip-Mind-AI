import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBook,
  FaPlus,
  FaTrash,
  FaVideo,
} from "react-icons/fa";

function MyCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    const savedCourses =
      JSON.parse(
        localStorage.getItem("educatorCourses")
      ) || [];

    setCourses(savedCourses);
  };

  const deleteCourse = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedCourses = courses.filter(
      (course) => course.id !== id
    );

    localStorage.setItem(
      "educatorCourses",
      JSON.stringify(updatedCourses)
    );

    setCourses(updatedCourses);
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <button
          style={styles.backButton}
          onClick={() => navigate("/educator")}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <h1 style={styles.title}>
            <FaBook /> My Courses
          </h1>

          <p style={styles.subtitle}>
            Manage all the courses created by you.
          </p>
        </div>

        <button
          style={styles.createButton}
          onClick={() =>
            navigate("/educator/create-course")
          }
        >
          <FaPlus />
          Create Course
        </button>

      </div>


      {/* COURSE COUNT */}

      <div style={styles.countCard}>

        <div style={styles.countIcon}>
          <FaBook />
        </div>

        <div>
          <h2 style={styles.count}>
            {courses.length}
          </h2>

          <p style={styles.countText}>
            Total Courses
          </p>
        </div>

      </div>


      {/* COURSES */}

      {courses.length === 0 ? (

        <div style={styles.emptyCard}>

          <FaBook style={styles.emptyIcon} />

          <h2>
            No Courses Yet
          </h2>

          <p>
            You haven't created any courses yet.
          </p>

          <button
            style={styles.createButton}
            onClick={() =>
              navigate("/educator/create-course")
            }
          >
            <FaPlus />
            Create Your First Course
          </button>

        </div>

      ) : (

        <div style={styles.courseGrid}>

          {courses.map((course) => (

            <div
              key={course.id}
              style={styles.courseCard}
            >

              {/* COURSE ICON */}

              <div style={styles.courseIcon}>
                <FaBook />
              </div>


              {/* COURSE INFORMATION */}

              <h2 style={styles.courseName}>
                {course.name}
              </h2>

              <span style={styles.category}>
                {course.category}
              </span>

              <p style={styles.description}>
                {course.description}
              </p>


              <div style={styles.courseInfo}>

                <span>
                  👨‍🏫{" "}
                  {course.createdBy}
                </span>

                <span>
                  📅{" "}
                  {course.createdAt}
                </span>

              </div>


              {/* ACTIONS */}

              <div style={styles.actions}>

                <button
                  style={styles.lectureButton}
                  onClick={() =>
                    navigate(
                      "/educator/upload-lecture"
                    )
                  }
                >
                  <FaVideo />
                  Add Lecture
                </button>

                <button
                  style={styles.deleteButton}
                  onClick={() =>
                    deleteCourse(course.id)
                  }
                >
                  <FaTrash />
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}


/* ================================================= */
/* STYLES */
/* ================================================= */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },


  /* HEADER */

  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },


  title: {
    margin: "0",
    fontSize: "30px",
    color: "#222",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },


  subtitle: {
    margin: "6px 0 0",
    color: "#777",
    fontSize: "14px",
  },


  backButton: {
    border: "none",
    background: "#e8ecf5",
    color: "#333",
    padding: "11px 17px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
  },


  createButton: {
    marginLeft: "auto",
    border: "none",
    background: "#5b5ce2",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
  },


  /* COUNT */

  countCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    width: "220px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
  },


  countIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    background: "#eef0ff",
    color: "#5b5ce2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },


  count: {
    margin: "0",
    fontSize: "25px",
    color: "#222",
  },


  countText: {
    margin: "3px 0 0",
    color: "#777",
    fontSize: "13px",
  },


  /* EMPTY */

  emptyCard: {
    background: "#fff",
    padding: "60px 30px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.06)",
  },


  emptyIcon: {
    fontSize: "55px",
    color: "#c8c9e8",
    marginBottom: "15px",
  },


  /* COURSE GRID */

  courseGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "22px",
  },


  /* COURSE CARD */

  courseCard: {
    background: "#fff",
    padding: "25px",
    borderRadius: "15px",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.06)",
    position: "relative",
  },


  courseIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#eef0ff",
    color: "#5b5ce2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    marginBottom: "15px",
  },


  courseName: {
    margin: "0 0 10px",
    fontSize: "20px",
    color: "#222",
  },


  category: {
    display: "inline-block",
    background: "#eeeefe",
    color: "#5b5ce2",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },


  description: {
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.5",
    minHeight: "45px",
    marginTop: "15px",
  },


  courseInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#888",
    fontSize: "12px",
    borderTop: "1px solid #eee",
    paddingTop: "15px",
    marginTop: "15px",
  },


  /* ACTIONS */

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },


  lectureButton: {
    flex: "1",
    border: "none",
    background: "#5b5ce2",
    color: "#fff",
    padding: "10px",
    borderRadius: "7px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    fontWeight: "600",
  },


  deleteButton: {
    width: "42px",
    border: "none",
    background: "#fff0f0",
    color: "#d32f2f",
    borderRadius: "7px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

};


export default MyCourses;
