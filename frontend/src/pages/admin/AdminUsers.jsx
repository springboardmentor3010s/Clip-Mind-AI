import React from "react";

const AdminUsers = () => {
  const users = [
    {
      id: 1,
      name: "Kajal",
      email: "kajal@example.com",
      role: "Administrator",
    },
    {
      id: 2,
      name: "Educator",
      email: "educator@clipmind.ai",
      role: "Educator",
    },
  ];

  return (
    <div style={styles.page}>
      <h1>👥 User Management</h1>
      <p style={styles.subtitle}>
        Manage ClipMind AI platform users.
      </p>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.role}</td>
                <td style={styles.td}>
                  <span style={styles.active}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "35px",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "25px",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "15px",
    borderBottom: "2px solid #eee",
  },

  td: {
    padding: "15px",
    borderBottom: "1px solid #eee",
  },

  active: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "15px",
    fontSize: "13px",
  },
};

export default AdminUsers;
