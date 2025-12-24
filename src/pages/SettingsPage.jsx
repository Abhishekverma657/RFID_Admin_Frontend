import React, { useState } from "react";
import { Lock, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { changePassword } from "../api/change_password";
import toast from "react-hot-toast";

export default function SettingsPage() {
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await changePassword({
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            });
            toast.success("Password changed successfully!");
            setMessage({ type: "success", text: "Password changed successfully!" });
            setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to change password";
            toast.error(errorMsg);
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
                    <p className="text-gray-500 text-sm">Update your security preferences</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-blue-600" />
                        Change Password
                    </h2>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
                            }`}>
                            {message.type === "error" ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Current Password</label>
                            <input
                                type="password"
                                name="oldPassword"
                                required
                                value={form.oldPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                required
                                value={form.newPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Min. 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Re-type new password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-amber-800 text-sm flex gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <span><b>Important:</b> After changing your password, you will need to log in again with your new credentials on your next session.</span>
                </p>
            </div>
        </div>
    );
}
