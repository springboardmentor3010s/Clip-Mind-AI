import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

function Profile() {

    const userId = localStorage.getItem("user_id");

    const [profile, setProfile] = useState({

        username: "",

        email: "",

        role: "",

        member_since: ""

    });

    const { theme, setTheme } = useContext(

    ThemeContext

);
    const [currentPassword, setCurrentPassword] = useState("");

    const [newPassword, setNewPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {

        fetchProfile();

    }, []);

    const fetchProfile = async () => {

        try {

            const res = await api.get(

                `/creator/profile/${userId}`

            );

            setProfile(res.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    const saveUsername = async () => {

        try {

            await api.put(

                `/creator/profile/${userId}`,

                {

                    username: profile.username

                }

            );

            localStorage.setItem(

                "username",

                profile.username

            );

            alert(

                "Username Updated"

            );

        }

        catch (err) {

            console.log(err);

        }

    };

    const changePassword = async () => {

        try {

            const res = await api.put(

                `/creator/change-password/${userId}`,

                {

                    current_password: currentPassword,

                    new_password: newPassword,

                    confirm_password: confirmPassword

                }

            );

            alert(

                res.data.message

            );

            setCurrentPassword("");

            setNewPassword("");

            setConfirmPassword("");

        }

        catch (err) {

            alert(

                err.response.data.detail

            );

        }

    };

    return (

        <DashboardLayout role="creator">

            <div className="profile-container">

                <h1>

                    Profile Settings

                </h1>

                <div className="profile-card">

                    <label>

                        Username

                    </label>

                    <input

                        value={profile.username}

                        onChange={(e) =>

                            setProfile({

                                ...profile,

                                username: e.target.value

                            })

                        }

                    />

                    <button

                        onClick={saveUsername}

                    >

                        Save Username

                    </button>

                </div>

                <div className="profile-card">

                    <label>

                        Email

                    </label>

                    <input

                        value={profile.email}

                        disabled

                    />

                </div>

                <div className="profile-card">

                    <label>

                        Role

                    </label>

                    <input

                        value={profile.role}

                        disabled

                    />

                </div>

                <div className="profile-card">

                    <label>

                        Member Since

                    </label>

                    <input

                        value={

                            profile.member_since
                                ? new Date(

                                    profile.member_since

                                ).toLocaleDateString()
                                : ""

                        }

                        disabled

                    />

                </div>

                <div className="profile-card">

                    <h2>

                        Change Password

                    </h2>

                    <input

                        type="password"

                        placeholder="Current Password"

                        value={currentPassword}

                        onChange={(e) =>

                            setCurrentPassword(e.target.value)

                        }

                    />

                    <input

                        type="password"

                        placeholder="New Password"

                        value={newPassword}

                        onChange={(e) =>

                            setNewPassword(e.target.value)

                        }

                    />

                    <input

                        type="password"

                        placeholder="Confirm Password"

                        value={confirmPassword}

                        onChange={(e) =>

                            setConfirmPassword(e.target.value)

                        }

                    />

                    <button

                        onClick={changePassword}

                    >

                        Update Password

                    </button>

                </div>

                <div className="profile-card">

<h2>

Appearance

</h2>

<label>

<input

type="radio"

checked={theme==="light"}

onChange={()=>

setTheme("light")

}

/>

Light Theme

</label>

<br/>

<br/>

<label>

<input

type="radio"

checked={theme==="dark"}

onChange={()=>

setTheme("dark")

}

/>

Dark Theme

</label>

</div>

            </div>

        </DashboardLayout>

    );

}

export default Profile;