import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Students() {

  const [students, setStudents] = useState([]);

  useEffect(() => {

    fetchStudents();

  }, []);

  const fetchStudents = async () => {

    try {

      const res = await api.get("/educator/students");

      setStudents(res.data);

    }

    catch (err) {

      console.log(err);

    }

  };

  return (

    <DashboardLayout role="educator">

      <h1>Students</h1>

      <p>View all registered learners.</p>

      <table className="students-table">

        <thead>

          <tr>

            <th>ID</th>

            <th>Name</th>

            <th>Email</th>

            <th>Role</th>

          </tr>

        </thead>

        <tbody>

          {

            students.length === 0 ?

            (

              <tr>

                <td colSpan="4">

                  No learners found.

                </td>

              </tr>

            )

            :

            (

              students.map((student) => (

                <tr key={student.id}>

                  <td>{student.id}</td>

                  <td>{student.name}</td>

                  <td>{student.email}</td>

                  <td>{student.role}</td>

                </tr>

              ))

            )

          }

        </tbody>

      </table>

    </DashboardLayout>

  );

}

export default Students;