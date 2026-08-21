import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBook,
  FaArrowLeft,
  FaSave,
  FaGraduationCap,
} from "react-icons/fa";

function CreateCourse() {
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const createCourse = (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Validate fields
    if (!courseName.trim()) {
      setError("Please enter a course name.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a course description.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    // Get existing courses
    const courses =
      JSON.parse(localStorage.getItem("educatorCourses")) || [];

    // Create new course
    const newCourse = {
      id: Date.now(),
      name: courseName.trim(),
      description: description.trim(),
      category: category,
      createdBy:
        localStorage.getItem("userEmail") ||
        "educator@clipmind.ai",
      createdAt: new Date().toLocaleDateString(),
    };

    // Add course
    courses.push(newCourse);

    // Save courses
    localStorage.setItem(
      "educatorCourses",
      JSON.stringify(courses)
    );

    // Success message
    setMessage("Course created successfully!");

    // Clear form
    setCourseName("");
    setDescription("");
    setCategory("");
  };

  return (
    <div style={styles.page}>

      {/* ================= HEADER ================= */}

      <div style={styles.header}>

        <button
          style={styles.backButton}
          onClick={() => navigate("/educator")}
        >
          <FaArrowLeft />
          Back
        </button>

        <div style={styles.headerTitleContainer}>
          <FaGraduationCap style={styles.headerIcon} />

          <div>
            <h1 style={styles.headerTitle}>
              Create Course
            </h1>

            <p style={styles.headerSubtitle}>
              Create and manage your educational courses
            </p>
          </div>
        </div>

      </div>


      {/* ================= COURSE FORM ================= */}

      <div style={styles.card}>

        <div style={styles.cardHeader}>

          <div style={styles.bookIcon}>
            <FaBook />
          </div>

          <div>
            <h2 style={styles.cardTitle}>
              Create a New Course
            </h2>

            <p style={styles.cardSubtitle}>
              Add course information to start teaching
              your students.
            </p>
          </div>

        </div>


        <form onSubmit={createCourse}>

          {/* COURSE NAME */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Course Name
            </label>

            <input
              type="text"
              placeholder="e.g. Introduction to Python"
              value={courseName}
              onChange={(e) =>
                setCourseName(e.target.value)
              }
              style={styles.input}
            />

          </div>


          {/* DESCRIPTION */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Course Description
            </label>

            <textarea
              placeholder="Describe what students will learn in this course..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              style={styles.textarea}
              rows="5"
            />

          </div>


          {/* CATEGORY */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              style={styles.select}
            >

              <option value="">
                Select course category
              </option>

              <option value="Computer Science">
                Computer Science
              </option>

              <option value="Programming">
                Programming
              </option>

              <option value="Artificial Intelligence">
                Artificial Intelligence
              </option>

              <option value="Machine Learning">
                Machine Learning
              </option>

              <option value="Data Science">
                Data Science
              </option>

              <option value="Database">
                Database
              </option>

              <option value="Web Development">
                Web Development
              </option>

              <option value="Cloud Computing">
                Cloud Computing
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          {/* BUTTONS */}

          <div style={styles.buttonContainer}>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => navigate("/educator")}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={styles.saveButton}
            >
              <FaSave />
              Create Course
            </button>

          </div>

        </form>


        {/* ================= SUCCESS MESSAGE ================= */}

        {message && (
          <div style={styles.successMessage}>
            ✓ {message}
          </div>
        )}


        {/* ================= ERROR MESSAGE ================= */}

        {error && (
          <div style={styles.errorMessage}>
            ⚠ {error}
          </div>
        )}

      </div>


      {/* ================= INFORMATION CARD ================= */}

      <div style={styles.infoCard}>

        <div style={styles.infoIcon}>
          💡
        </div>

        <div>

          <h3 style={styles.infoTitle}>
            What happens next?
          </h3>

          <p style={styles.infoText}>
            After creating your course, you can add
            lectures, upload educational videos and
            use ClipMind AI to generate transcripts,
            summaries and key moments.
          </p>

        </div>

      </div>

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
    gap: "25px",
    marginBottom: "30px",
  },


  headerTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },


  headerIcon: {
    fontSize: "38px",
    color: "#5b5ce2",
  },


  headerTitle: {
    margin: "0",
    fontSize: "30px",
    color: "#222",
  },


  headerSubtitle: {
    margin: "5px 0 0 0",
    color: "#777",
    fontSize: "14px",
  },


  /* BACK BUTTON */

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
    fontSize: "14px",
    fontWeight: "600",
  },


  /* MAIN CARD */

  card: {
    maxWidth: "750px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },


  /* CARD HEADER */

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #eeeeee",
  },


  bookIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#eef0ff",
    color: "#5b5ce2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },


  cardTitle: {
    margin: "0",
    fontSize: "22px",
    color: "#222",
  },


  cardSubtitle: {
    margin: "5px 0 0 0",
    color: "#777",
    fontSize: "14px",
  },


  /* FORM */

  formGroup: {
    marginBottom: "22px",
  },


  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#333",
    fontSize: "14px",
  },


  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },


  textarea: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },


  select: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    fontSize: "15px",
    background: "white",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box",
  },


  /* BUTTONS */

  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "30px",
  },


  cancelButton: {
    padding: "12px 22px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#555",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },


  saveButton: {
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    background: "#5b5ce2",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },


  /* SUCCESS */

  successMessage: {
    marginTop: "20px",
    padding: "13px",
    background: "#e8f7ed",
    color: "#187a3d",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },


  /* ERROR */

  errorMessage: {
    marginTop: "20px",
    padding: "13px",
    background: "#fff0f0",
    color: "#c62828",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },


  /* INFORMATION CARD */

  infoCard: {
    maxWidth: "750px",
    margin: "20px auto 0",
    padding: "20px",
    background: "#eef0ff",
    borderRadius: "12px",
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    boxSizing: "border-box",
  },


  infoIcon: {
    fontSize: "25px",
  },


  infoTitle: {
    margin: "0 0 6px 0",
    color: "#333",
    fontSize: "16px",
  },


  infoText: {
    margin: "0",
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.6",
  },

};


export default CreateCourse;
