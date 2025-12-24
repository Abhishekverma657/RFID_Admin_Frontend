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
  Trash2,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getInstitute, getInstituteDetails } from "../api/super_admin/get_institute";
import { deleteInstitute } from "../api/super_admin/delete_institute";
import toast from "react-hot-toast";

export default function InstituteList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const res = await getInstitute();
      setInstitutes(res.institutes || []);
    } catch {
      setInstitutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this institute? This action cannot be undone.")) return;

    setDeletingId(id);
    try {
      await deleteInstitute(id);
      setInstitutes(institutes.filter(i => i._id !== id));
      toast.success("Institute deleted successfully");
    } catch (err) {
      toast.error("Failed to delete institute: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await getInstituteDetails(id);
      setSelectedInstitute(res.institute);
      setModalOpen(true);
    } catch {
      toast.error("Failed to fetch institute details");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Institutes Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage all registered institutes</p>
        </div>
        <button
          onClick={fetchInstitutes}
          className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && institutes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={40} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {institutes.map((i) => (
            <div
              key={i._id}
              className="
                group bg-white border rounded-2xl md:rounded-3xl shadow-md p-5 md:p-6
                hover:shadow-xl hover:-translate-y-1 hover:border-blue-200
                transition-all duration-300 relative
              "
            >
              <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 rounded-t-3xl bg-gradient-to-r from-blue-500 to-indigo-600" />

              <div className="flex items-start justify-between mt-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold line-clamp-1">{i.name}</h2>
                    <p className="text-xs text-gray-500">Code: {i.code}</p>
                  </div>
                </div>
                <button
                  disabled={deletingId === i._id}
                  onClick={(e) => handleDelete(i._id, e)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  {deletingId === i._id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>

              <div className="space-y-3 text-gray-700 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <span className="text-gray-500">Users</span>
                  <span className="font-semibold">{i.studentCount ?? 0} Students • {i.teacherCount ?? 0} Tech</span>
                </div>
                <p className="flex items-center gap-2">
                  <User size={16} className="text-blue-600 shrink-0" />
                  <span className="truncate">Admin: {i.adminUserId || "N/A"}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{i.address}</span>
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleViewDetails(i._id)}
                  className="flex items-center gap-2 text-blue-700 text-sm font-bold hover:text-blue-900 transition"
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
                  className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${selectedInstitute.isActive
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
