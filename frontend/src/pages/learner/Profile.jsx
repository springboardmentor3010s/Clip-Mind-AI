import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";


function Profile() {

    const userId =
        localStorage.getItem("user_id");


    const [profile, setProfile] = useState({

        username: "",

        email: "",

        role: "",

        member_since: ""

    });


    const {
        theme,
        setTheme
    } = useContext(
        ThemeContext
    );


    const [
        currentPassword,
        setCurrentPassword
    ] = useState("");


    const [
        newPassword,
        setNewPassword
    ] = useState("");


    const [
        confirmPassword,
        setConfirmPassword
    ] = useState("");


    const [
        savingUsername,
        setSavingUsername
    ] = useState(false);


    const [
        changingPassword,
        setChangingPassword
    ] = useState(false);


    useEffect(() => {

        fetchProfile();

    }, []);


    // =========================================
    // FETCH PROFILE
    // =========================================

    const fetchProfile = async () => {

        try {

            const res = await api.get(

                `/learner/profile/${userId}`

            );

            setProfile(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load profile:",
                err
            );

        }

    };


    // =========================================
    // SAVE USERNAME
    // =========================================

    const saveUsername = async () => {

        if (!profile.username.trim()) {

            alert(
                "Username cannot be empty."
            );

            return;

        }


        try {

            setSavingUsername(true);

            await api.put(

                `/learner/profile/${userId}`,

                {

                    username:
                        profile.username

                }

            );


            localStorage.setItem(

                "username",

                profile.username

            );


            alert(
                "Username updated successfully."
            );

        }

        catch (err) {

            console.error(err);

            alert(

                err.response?.data?.detail ||
                "Failed to update username."

            );

        }

        finally {

            setSavingUsername(false);

        }

    };


    // =========================================
    // CHANGE PASSWORD
    // =========================================

    const changePassword = async () => {

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            alert(
                "Please fill all password fields."
            );

            return;

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            alert(
                "New passwords do not match."
            );

            return;

        }


        try {

            setChangingPassword(true);


            const res = await api.put(

                `/learner/change-password/${userId}`,

                {

                    current_password:
                        currentPassword,

                    new_password:
                        newPassword,

                    confirm_password:
                        confirmPassword

                }

            );


            alert(
                res.data.message ||
                "Password updated successfully."
            );


            setCurrentPassword("");

            setNewPassword("");

            setConfirmPassword("");

        }

        catch (err) {

            console.error(err);

            alert(

                err.response?.data?.detail ||
                "Failed to change password."

            );

        }

        finally {

            setChangingPassword(false);

        }

    };


    return (

        <DashboardLayout role="learner">

            <div className="learner-profile-page">

                <div className="learner-profile-header">

                    <div>

                        <h1>
                            Profile Settings
                        </h1>

                        <p>
                            Manage your learner account
                            and preferences.
                        </p>

                    </div>

                </div>


                {/* =====================================
                    ACCOUNT INFORMATION
                ===================================== */}

                <div className="learner-profile-card">

                    <div className="profile-section-header">

                        <div className="profile-avatar">
                            {profile.username
                                ? profile.username
                                    .charAt(0)
                                    .toUpperCase()
                                : "L"}
                        </div>

                        <div>

                            <h2>
                                Account Information
                            </h2>

                            <p>
                                Your basic account details.
                            </p>

                        </div>

                    </div>


                    <div className="profile-field">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={
                                profile.username
                            }
                            onChange={(e) =>
                                setProfile({

                                    ...profile,

                                    username:
                                        e.target.value

                                })
                            }
                        />

                    </div>


                    <button
                        className="profile-primary-button"
                        onClick={
                            saveUsername
                        }
                        disabled={
                            savingUsername
                        }
                    >

                        {savingUsername
                            ? "Saving..."
                            : "Save Username"}

                    </button>


                    <div className="profile-field">

                        <label>
                            Email
                        </label>

                        <input
                            value={
                                profile.email
                            }
                            disabled
                        />

                    </div>


                    <div className="profile-field">

                        <label>
                            Role
                        </label>

                        <input
                            value="Learner"
                            disabled
                        />

                    </div>


                    <div className="profile-field">

                        <label>
                            Member Since
                        </label>

                        <input
                            value={
                                profile.member_since
                                    ? new Date(
                                        profile.member_since
                                    ).toLocaleDateString(
                                        "en-IN",
                                        {
                                            timeZone:
                                                "Asia/Kolkata"
                                        }
                                    )
                                    : ""
                            }
                            disabled
                        />

                    </div>

                </div>


                {/* =====================================
                    CHANGE PASSWORD
                ===================================== */}

                <div className="learner-profile-card">

                    <div className="profile-section-header">

                        <div className="profile-icon">
                            🔐
                        </div>

                        <div>

                            <h2>
                                Change Password
                            </h2>

                            <p>
                                Keep your account secure
                                with a strong password.
                            </p>

                        </div>

                    </div>


                    <div className="profile-field">

                        <label>
                            Current Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={
                                currentPassword
                            }
                            onChange={(e) =>
                                setCurrentPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="profile-field">

                        <label>
                            New Password
                        </label>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={
                                newPassword
                            }
                            onChange={(e) =>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="profile-field">

                        <label>
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={
                                confirmPassword
                            }
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <button
                        className="profile-primary-button"
                        onClick={
                            changePassword
                        }
                        disabled={
                            changingPassword
                        }
                    >

                        {changingPassword
                            ? "Updating..."
                            : "Update Password"}

                    </button>

                </div>


                {/* =====================================
                    APPEARANCE
                ===================================== */}

                <div className="learner-profile-card">

                    <div className="profile-section-header">

                        <div className="profile-icon">
                            🎨
                        </div>

                        <div>

                            <h2>
                                Appearance
                            </h2>

                            <p>
                                Choose how ClipMind AI
                                looks for you.
                            </p>

                        </div>

                    </div>


                    <div className="profile-theme-options">

                        <label
                            className={
                                theme === "light"
                                    ? "theme-option selected"
                                    : "theme-option"
                            }
                        >

                            <input
                                type="radio"
                                checked={
                                    theme === "light"
                                }
                                onChange={() =>
                                    setTheme(
                                        "light"
                                    )
                                }
                            />

                            <span>
                                ☀️
                            </span>

                            <div>

                                <strong>
                                    Light
                                </strong>

                                <small>
                                    Bright interface
                                </small>

                            </div>

                        </label>


                        <label
                            className={
                                theme === "dark"
                                    ? "theme-option selected"
                                    : "theme-option"
                            }
                        >

                            <input
                                type="radio"
                                checked={
                                    theme === "dark"
                                }
                                onChange={() =>
                                    setTheme(
                                        "dark"
                                    )
                                }
                            />

                            <span>
                                🌙
                            </span>

                            <div>

                                <strong>
                                    Dark
                                </strong>

                                <small>
                                    Easier on the eyes
                                </small>

                            </div>

                        </label>

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Profile;