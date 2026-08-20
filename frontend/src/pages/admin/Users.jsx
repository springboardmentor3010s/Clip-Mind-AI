import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Users() {

    const [users, setUsers] = useState([]);

    const [search, setSearch] = useState("");

    useEffect(() => {

        loadUsers();

    }, []);


    const loadUsers = async () => {

        try {

            const res = await api.get(
                "/admin/users"
            );

            setUsers(res.data);

        } catch (err) {

            console.error(err);

        }

    };


    const changeRole = async (
        userId,
        role
    ) => {

        try {

            await api.put(

                `/admin/users/${userId}/role`,

                null,

                {
                    params: {
                        role
                    }
                }

            );

            loadUsers();

        } catch (err) {

            alert(
                err.response?.data?.detail ||
                "Failed to update role."
            );

        }

    };


    const filteredUsers =
        users.filter((user) =>

            user.username
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||

            user.email
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )

        );


    return (

        <DashboardLayout role="admin">

            <div className="admin-users-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            User Management
                        </h1>

                        <p>
                            Manage platform users
                            and their roles.
                        </p>

                    </div>

                </div>


                <input
                    className="admin-search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                />


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    Username
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Joined
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredUsers.map(
                                (user) => (

                                <tr
                                    key={user.id}
                                >

                                    <td>
                                        {user.username}
                                    </td>

                                    <td>
                                        {user.email}
                                    </td>

                                    <td>

                                        <select
                                            value={
                                                user.role
                                            }
                                            onChange={(e) =>
                                                changeRole(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="learner">
                                                Learner
                                            </option>

                                            <option value="educator">
                                                Educator
                                            </option>

                                            <option value="creator">
                                                Creator
                                            </option>

                                            <option value="admin">
                                                Admin
                                            </option>

                                        </select>

                                    </td>

                                    <td>

                                        {user.created_at
                                            ? new Date(
                                                user.created_at
                                            ).toLocaleDateString()
                                            : "-"}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Users;