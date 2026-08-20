import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Settings() {

    const [settings, setSettings] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(null);


    useEffect(() => {

        loadSettings();

    }, []);


    const loadSettings = async () => {

        try {

            const res = await api.get(
                "/admin/settings"
            );

            setSettings(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load settings:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const updateSetting = async (
        key,
        value
    ) => {

        try {

            setSaving(key);

            await api.put(

                `/admin/settings/${key}`,

                null,

                {
                    params: {
                        setting_value:
                            value
                    }
                }

            );

            alert(
                "Setting updated successfully."
            );

        }

        catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Failed to update setting."
            );

        }

        finally {

            setSaving(null);

        }

    };


    const updateLocalValue = (
        key,
        value
    ) => {

        setSettings(
            settings.map(
                (setting) =>

                    setting.key === key

                        ? {
                            ...setting,
                            value
                        }

                        : setting
            )
        );

    };


    if (loading) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Platform Settings...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-settings-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            Platform Settings
                        </h1>

                        <p>
                            Configure platform-wide
                            behavior and limits.
                        </p>

                    </div>

                </div>


                <div className="settings-list">

                    {settings.map(
                        (setting) => (

                        <div
                            className="setting-card"
                            key={setting.key}
                        >

                            <div className="setting-info">

                                <h2>

                                    {setting.key
                                        .replace(
                                            /_/g,
                                            " "
                                        )
                                        .replace(
                                            /\b\w/g,
                                            (char) =>
                                                char.toUpperCase()
                                        )}

                                </h2>

                                <p>
                                    {setting.description}
                                </p>

                            </div>


                            <div className="setting-control">

                                {setting.key ===
                                "ai_processing_enabled" ? (

                                    <label className="setting-toggle">

                                        <input
                                            type="checkbox"
                                            checked={
                                                setting.value ===
                                                "true"
                                            }
                                            onChange={(e) =>
                                                updateLocalValue(
                                                    setting.key,
                                                    e.target.checked
                                                        ? "true"
                                                        : "false"
                                                )
                                            }
                                        />

                                        <span>
                                            {setting.value ===
                                            "true"
                                                ? "Enabled"
                                                : "Disabled"}
                                        </span>

                                    </label>

                                ) : (

                                    <input
                                        value={
                                            setting.value
                                        }
                                        onChange={(e) =>
                                            updateLocalValue(
                                                setting.key,
                                                e.target.value
                                            )
                                        }
                                    />

                                )}


                                <button
                                    className="settings-save-button"
                                    disabled={
                                        saving ===
                                        setting.key
                                    }
                                    onClick={() =>
                                        updateSetting(
                                            setting.key,
                                            setting.value
                                        )
                                    }
                                >

                                    {saving ===
                                    setting.key
                                        ? "Saving..."
                                        : "Save"}

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Settings;