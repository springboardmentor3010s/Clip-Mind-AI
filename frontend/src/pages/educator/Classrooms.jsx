import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaPlus,
  FaUsers,
  FaBook,
  FaArrowLeft,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

function Classrooms() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState(() => {
    const saved = localStorage.getItem("educatorClassrooms");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);

  const [classroomName, setClassroomName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");

  const createClassroom = () => {
    if (!classroomName.trim() || !courseName.trim()) {
      alert("Please enter classroom name and course name.");
      return;
    }

    const newClassroom = {
      id: Date.now(),
      name: classroomName,
      course: courseName,
      description: description,
      students: 0,
      status: "Active",
      createdAt: new Date().toLocaleDateString(),
    };

    const updatedClassrooms = [
      ...classrooms,
      newClassroom,
    ];

    setClassrooms(updatedClassrooms);

    localStorage.setItem(
      "educatorClassrooms",
      JSON.stringify(updatedClassrooms)
    );

    setClassroomName("");
    setCourseName("");
    setDescription("");
    setShowForm(false);
  };

  const deleteClassroom = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this classroom?"
    );

    if (!confirmDelete) return;

    const updatedClassrooms = classrooms.filter(
      (classroom) => classroom.id !== id
    );

    setClassrooms(updatedClassrooms);

    localStorage.setItem(
      "educatorClassrooms",
      JSON.stringify(updatedClassrooms)
    );
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <button
            onClick={() => navigate("/educator")}
            style={styles.backButton}
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>

          <h1 style={styles.title}>
            <FaChalkboardTeacher />
            Classrooms
          </h1>

          <p style={styles.subtitle}>
            Create and manage your virtual classrooms.
          </p>
        </div>

        <button
          style={styles.createButton}
          onClick={() => setShowForm(true)}
        >
          <FaPlus />
          Create Classroom
        </button>

      </div>


      {/* CREATE CLASSROOM FORM */}

      {showForm && (
        <div style={styles.formCard}>

          <div style={styles.formHeader}>

            <h2>Create New Classroom</h2>

            <button
              style={styles.closeButton}
              onClick={() => setShowForm(false)}
            >
              <FaTimes />
            </button>

          </div>

          <div style={styles.formGrid}>

            <div style={styles.field}>
              <label>Classroom Name</label>

              <input
                type="text"
                placeholder="e.g. Data Structures - MCA"
                value={classroomName}
                onChange={(e) =>
                  setClassroomName(e.target.value)
                }
                style={styles.input}
              />
            </div>


            <div style={styles.field}>
              <label>Course Name</label>

              <input
                type="text"
                placeholder="e.g. Data Structures"
                value={courseName}
                onChange={(e) =>
                  setCourseName(e.target.value)
                }
                style={styles.input}
              />
            </div>

          </div>


          <div style={styles.field}>
            <label>Description</label>

            <textarea
              placeholder="Enter classroom description..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              style={styles.textarea}
            />
          </div>


          <div style={styles.formActions}>

            <button
              style={styles.cancelButton}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button
              style={styles.saveButton}
              onClick={createClassroom}
            >
              <FaPlus />
              Create Classroom
            </button>

          </div>

        </div>
      )}


      {/* CLASSROOM STATISTICS */}

      <div style={styles.statsGrid}>

        <div style={styles.statCard}>
          <FaChalkboardTeacher style={styles.statIcon} />

          <div>
            <h2>{classrooms.length}</h2>
            <p>Total Classrooms</p>
          </div>
        </div>


        <div style={styles.statCard}>
          <FaUsers style={styles.statIcon} />

          <div>
            <h2>
              {classrooms.reduce(
                (total, classroom) =>
                  total + classroom.students,
                0
              )}
            </h2>

            <p>Total Students</p>
          </div>
        </div>


        <div style={styles.statCard}>
          <FaBook style={styles.statIcon} />

          <div>
            <h2>
              {
                classrooms.filter(
                  (classroom) =>
                    classroom.status === "Active"
                ).length
              }
            </h2>

            <p>Active Classrooms</p>
          </div>
        </div>

      </div>


      {/* CLASSROOM LIST */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <h2>Your Classrooms</h2>

          <span>
            {classrooms.length} classroom
            {classrooms.length !== 1 ? "s" : ""}
          </span>

        </div>


        {classrooms.length === 0 ? (

          <div style={styles.emptyState}>

            <FaChalkboardTeacher
              style={styles.emptyIcon}
            />

            <h2>No classrooms yet</h2>

            <p>
              Create your first classroom to start
              managing students and lectures.
            </p>

            <button
              style={styles.createButton}
              onClick={() => setShowForm(true)}
            >
              <FaPlus />
              Create Classroom
            </button>

          </div>

        ) : (

          <div style={styles.classroomGrid}>

            {classrooms.map((classroom) => (

              <div
                key={classroom.id}
                style={styles.classroomCard}
              >

                <div style={styles.cardTop}>

                  <div style={styles.classroomIcon}>
                    <FaChalkboardTeacher />
                  </div>

                  <span style={styles.activeBadge}>
                    {classroom.status}
                  </span>

                </div>


                <h2>{classroom.name}</h2>

                <p style={styles.course}>
                  <FaBook />
                  {classroom.course}
                </p>

                <p style={styles.description}>
                  {classroom.description ||
                    "No description provided."}
                </p>


                <div style={styles.cardInfo}>

                  <div>
                    <FaUsers />
                    <span>
                      {classroom.students} Students
                    </span>
                  </div>

                  <div>
                    Created: {classroom.createdAt}
                  </div>

                </div>


                <div style={styles.cardActions}>

                  <button
                    style={styles.manageButton}
                    onClick={() =>
                      alert(
                        `Classroom: ${classroom.name}\nStudents: ${classroom.students}`
                      )
                    }
                  >
                    Manage Classroom
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() =>
                      deleteClassroom(classroom.id)
                    }
                  >
                    <FaTrash />
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}


const styles = {

  page: {
    minHeight: "100vh",
    padding: "35px",
    background:
      "linear-gradient(135deg, #f5f7ff, #eef2ff)",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "15px",
    fontSize: "14px",
  },

  title: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    color: "#666",
    marginTop: "8px",
  },

  createButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "none",
    borderRadius: "10px",
    padding: "13px 20px",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },

  formCard: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "30px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  },

  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
  },

  textarea: {
    minHeight: "100px",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    resize: "vertical",
    fontSize: "15px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  cancelButton: {
    padding: "12px 20px",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: "8px",
    cursor: "pointer",
  },

  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginBottom: "35px",
  },

  statCard: {
    background: "white",
    padding: "22px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  statIcon: {
    fontSize: "28px",
    color: "#4f46e5",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#666",
  },

  emptyIcon: {
    fontSize: "55px",
    color: "#4f46e5",
  },

  classroomGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(300px,1fr))",
    gap: "22px",
  },

  classroomCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    background: "#fafbff",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  classroomIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4f46e5",
  },

  activeBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  course: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#4f46e5",
  },

  description: {
    color: "#666",
    minHeight: "45px",
  },

  cardInfo: {
    borderTop: "1px solid #eee",
    paddingTop: "12px",
    marginTop: "15px",
    fontSize: "13px",
    color: "#666",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },

  cardActions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },

  manageButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },

  deleteButton: {
    width: "42px",
    border: "none",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
  },
};

export default Classrooms;
