"use client";
import { useState, useEffect } from "react";
import { apiClient } from "../../../../lib/api";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.groups.getAll();
      setGroups(response.data || []);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.groups.create(formData);
      if (response.data) {
        toast.success("Group created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", description: "" });
        loadGroups();
      }
    } catch (error) {
      console.error("Create group error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create group";
      toast.error(errorMessage);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.groups.update(selectedGroup.id, formData);
      toast.success("Group updated successfully!");
      setShowEditModal(false);
      setSelectedGroup(null);
      setFormData({ name: "", description: "" });
      loadGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this group? This will not delete the contacts.")) return;
    try {
      await apiClient.groups.delete(id);
      toast.success("Group deleted successfully!");
      loadGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile || !selectedGroup) return;

    try {
      setUploading(true);
      
      // Step 1: Upload and parse Excel file
      const uploadResponse = await apiClient.uploads.uploadExcel(excelFile);
      const { contacts, errors } = uploadResponse.data;

      if (errors.length > 0) {
        toast.warning(`${errors.length} row(s) have errors. Please review.`);
      }

      if (contacts.length === 0) {
        toast.error("No valid contacts found in the Excel file");
        setUploading(false);
        return;
      }

      // Step 2: Create contacts (bulk create)
      const bulkResponse = await apiClient.contacts.bulkCreate({ contacts });
      const { created, skipped } = bulkResponse.data;

      if (created === 0) {
        toast.warning("No new contacts were created. They may already exist.");
        setUploading(false);
        return;
      }

      // Step 3: Get created contact IDs (we need to fetch them)
      const allContacts = await apiClient.contacts.getAll({ page: 1, limit: 1000 });
      const createdContacts = allContacts.data?.data?.filter(c => 
        contacts.some(ec => ec.phone === c.phone)
      ) || [];

      if (createdContacts.length > 0) {
        // Step 4: Add contacts to group
        await apiClient.groups.addContacts(selectedGroup.id, {
          contactIds: createdContacts.map(c => c.id),
        });
      }

      toast.success(
        `Successfully imported ${created} contact(s) into group. ${skipped} skipped.`
      );
      setShowExcelModal(false);
      setExcelFile(null);
      setExcelPreview(null);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error("Excel upload error:", error);
      toast.error(
        error.response?.data?.message || "Failed to upload Excel file. Please check the format."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const validExtensions = [".xlsx", ".xls"];

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    ) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setExcelFile(file);

    // Preview: Upload and show preview
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.uploads.uploadExcel(file);
      setExcelPreview(response.data);
    } catch (error) {
      toast.error("Failed to parse Excel file. Please check the format.");
      setExcelFile(null);
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, description: group.description || "" });
    setShowEditModal(true);
  };

  const openExcelModal = (group) => {
    setSelectedGroup(group);
    setShowExcelModal(true);
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading groups...</div>
      </div>
    );
  }

  const handleCreateClick = () => {
    console.log('Create Group button clicked - handler called');
    setShowCreateModal(true);
  };

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Manage your contact groups</p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm flex items-center gap-2 cursor-pointer relative z-50"
        >
          <PlusIcon className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No groups found</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors cursor-pointer"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(group)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit group"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete group"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  {group.contacts?.length || 0} contacts
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="flex-1 text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={() => openExcelModal(group)}
                  className="flex-1 text-center text-green-600 hover:text-green-800 text-sm font-medium py-2 border border-green-600 rounded-md hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
                  title="Upload Excel"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreateModal(false);
            setFormData({ name: "", description: "" });
          }
        }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create Group</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedGroup(null);
                  setFormData({ name: "", description: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Excel to {selectedGroup.name}
              </h2>
              <button
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelFile(null);
                  setExcelPreview(null);
                  setSelectedGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleExcelUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel File (.xlsx or .xls)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="excel-file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {excelFile ? excelFile.name : "Click to upload Excel file"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Required columns: Name, Phone
                    </span>
                  </label>
                </div>
              </div>

              {excelPreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Total rows:</span> {excelPreview.totalRows}
                    </p>
                    <p>
                      <span className="font-medium">Valid contacts:</span>{" "}
                      <span className="text-green-600">{excelPreview.validRows}</span>
                    </p>
                    {excelPreview.errors.length > 0 && (
                      <div>
                        <span className="font-medium">Errors:</span>{" "}
                        <span className="text-red-600">{excelPreview.errors.length}</span>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {excelPreview.errors.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600">
                              Row {error.row}: {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {excelPreview.contacts.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium mb-1">Sample contacts:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {excelPreview.contacts.slice(0, 5).map((contact, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              {contact.name} - {contact.phone}
                            </div>
                          ))}
                          {excelPreview.contacts.length > 5 && (
                            <div className="text-xs text-gray-500">
                              ... and {excelPreview.contacts.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!excelFile || uploading || !excelPreview}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Importing..." : "Import Contacts"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExcelModal(false);
                    setExcelFile(null);
                    setExcelPreview(null);
                    setSelectedGroup(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
