import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import {
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  User,
  X,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getInstitute, getInstituteDetails } from "../api/super_admin/get_institute";

export default function InstituteList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await getInstitute();
      setInstitutes(res.institutes || []);
    } catch {
      setInstitutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await getInstituteDetails(id);
      setSelectedInstitute(res.institute);
      setModalOpen(true);
    } catch {
      alert("Failed to fetch institute details");
    }
  };

  return (
    <SuperAdminLayout>
      <h1 className="text-3xl font-bold mb-10 text-gray-800 tracking-tight">
        Institutes Overview
      </h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {institutes.map((i) => (
            <div
              key={i._id}
              className="
                group bg-white border rounded-3xl shadow-md p-6
                hover:shadow-2xl hover:-translate-y-1 hover:border-blue-200
                transition-all duration-300 relative
              "
            >
              <div className="absolute top-0 left-0 w-full h-2 rounded-t-3xl bg-gradient-to-r from-blue-500 to-indigo-600" />

              <div className="flex items-center gap-4 mt-4 mb-6">
                <div className="p-4 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Building2 size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{i.name}</h2>
                  <p className="text-sm text-gray-500">Code: {i.code}</p>
                </div>
              </div>

              <div className="space-y-3 text-gray-700 text-sm">
                <p>
                  <b>Students:</b> {i.studentCount ?? 0} | <b>Teachers:</b>{" "}
                  {i.teacherCount ?? 0}
                </p>
                <p className="flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Admin ID: {i.adminUserId || "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  {i.address}
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleViewDetails(i._id)}
                  className="flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-900 transition"
                >
                  View Details
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODERN DETAIL MODAL ================= */}
      <AnimatePresence>
        {modalOpen && selectedInstitute && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Building2 size={30} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedInstitute.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Code: {selectedInstitute.code}
                  </p>
                </div>
                <span
                  className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedInstitute.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedInstitute.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 text-sm mb-8">
                <div className="flex gap-3">
                  <MapPin className="text-blue-600" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">
                      {selectedInstitute.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="text-blue-600" />
                  <div>
                    <p className="font-medium">Admin User ID</p>
                    <p className="text-gray-600">
                      {selectedInstitute.adminUserId}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="text-blue-600" />
                  <div>
                    <p className="font-medium">Created At</p>
                    <p className="text-gray-600">
                      {new Date(
                        selectedInstitute.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="text-blue-600" />
                  <div>
                    <p className="font-medium">Updated At</p>
                    <p className="text-gray-600">
                      {new Date(
                        selectedInstitute.updatedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Card */}
              <div className="bg-gray-50 border rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="text-blue-600" /> Admin Details
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <b>Name:</b> {selectedInstitute.admin?.name}
                  </p>
                  <p>
                    <b>Role:</b> {selectedInstitute.admin?.role}
                  </p>
                  <p className="flex items-center gap-2 col-span-2">
                    <Mail size={16} className="text-blue-600" />
                    {selectedInstitute.admin?.email}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SuperAdminLayout>
  );
}
