import React, { useState } from "react";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { Building2, Hash, Mail, Phone, MapPin } from "lucide-react";
import { createInstitute } from "../api/super_admin/create_institute";

export default function SuperAdminDashboard() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    adminEmail: "",
    adminName: "", // <-- change here
    address: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Institute Created:", form);
    try {
       console.log("Creating institute with data:", form);
      const response =  await createInstitute(form);
      console.log("Institute created successfully:", response);
      alert("Institute created successfully!");
    } catch (error) {
      console.error("Error creating institute:", error);
      alert("Failed to create institute. Please try again.");
    }
    setForm({
      name: "",
      code: "",
      adminEmail: "",
      adminName: "", // <-- change here
      address: "",
    });
  };

  return (
    <SuperAdminLayout>
      <h1 className="text-4xl font-bold mb-8 text-gray-800 tracking-tight">
        Create New Institute
      </h1>

      {/* Ultra Modern Card */}
      <div
        className="
        bg-white/70 backdrop-blur-xl border border-gray-200 
        rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]
        w-full p-10 transition-all duration-500 
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
        hover:scale-[1.01]
      "
      >
        {/* Header section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-gray-700">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            Institute Details
          </h2>
          <p className="text-gray-500 mt-2">
            Fill all required information to register a new institute.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Institute Name */}
          <div className="relative">
            <Building2 className="absolute left-4 top-3 text-blue-500" size={20} />

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="
                peer w-full px-12 py-3 bg-gray-50 border border-gray-300 rounded-xl
                outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300
                transition-all text-gray-800
              "
            />
            <label
              className="
                absolute left-12 top-3 text-gray-500 transition-all duration-200
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Institute Name
            </label>
          </div>

          {/* Institute Code */}
          <div className="relative">
            <Hash className="absolute left-4 top-3 text-blue-500" size={20} />

            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              className="
                peer w-full px-12 py-3 bg-gray-50 border border-gray-300 rounded-xl
                outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300
                transition-all text-gray-800
              "
            />
            <label
              className="
                absolute left-12 top-3 text-gray-500 transition-all
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Institute Code
            </label>
          </div>

          {/* Admin Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3 text-blue-500" size={20} />

            <input
              type="email"
              name="adminEmail"
              value={form.adminEmail}
              onChange={handleChange}
              required
              className="
                peer w-full px-12 py-3 bg-gray-50 border border-gray-300 rounded-xl
                outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300
                transition-all text-gray-800
              "
            />
            <label
              className="
                absolute left-12 top-3 text-gray-500 transition-all
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Admin Email
            </label>
          </div>

          {/* Admin Name */}
          <div className="relative">
            <Mail className="absolute left-4 top-3 text-blue-500" size={20} />
            <input
              name="adminName"
              value={form.adminName}
              onChange={handleChange}
              required
              className="
                peer w-full px-12 py-3 bg-gray-50 border border-gray-300 rounded-xl
                outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300
                transition-all text-gray-800
              "
            />
            <label
              className="
                absolute left-12 top-3 text-gray-500 transition-all
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Admin Name
            </label>
          </div>

          {/* Address */}
          <div className="relative">
            <MapPin className="absolute left-4 top-3 text-blue-500" size={20} />

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className="
                peer w-full px-12 py-3 bg-gray-50 border border-gray-300 rounded-xl
                outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300
                transition-all text-gray-800 h-28 resize-none
              "
            ></textarea>

            <label
              className="
                absolute left-12 top-3 text-gray-500 transition-all
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Institute Address
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="
              w-full py-3 bg-blue-600 text-white rounded-xl font-semibold 
              shadow-lg hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02]
              transition-all
            "
          >
            Create Institute
          </button>

        </form>
      </div>
    </SuperAdminLayout>
  );
}
