"use client";
import { useState, useEffect } from "react";
import { apiClient } from "../../../../lib/api";
import { toast } from "react-toastify";
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [bulkData, setBulkData] = useState("");

  useEffect(() => {
    loadContacts();
  }, [search]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = search ? { search, page: 1, limit: 100 } : { page: 1, limit: 100 };
      const response = await apiClient.contacts.getAll(params);
      setContacts(response.data?.data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.contacts.create(formData);
      if (response.data) {
        toast.success("Contact created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", phone: "" });
        loadContacts();
      }
    } catch (error) {
      console.error("Create contact error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create contact";
      toast.error(errorMessage);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    try {
      // Parse bulk data (format: Name,Phone\nName,Phone)
      const lines = bulkData.split("\n").filter((line) => line.trim());
      const contacts = lines.map((line) => {
        const [name, phone] = line.split(",").map((s) => s.trim());
        return { name, phone };
      });

      const response = await apiClient.contacts.bulkCreate({ contacts });
      toast.success(
        `Created ${response.data.created} contacts. ${response.data.skipped} skipped.`
      );
      setShowBulkModal(false);
      setBulkData("");
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create contacts");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.contacts.update(selectedContact.id, formData);
      toast.success("Contact updated successfully!");
      setShowEditModal(false);
      setSelectedContact(null);
      setFormData({ name: "", phone: "" });
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update contact");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await apiClient.contacts.delete(id);
      toast.success("Contact deleted successfully!");
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete contact");
    }
  };

  const openEditModal = (contact) => {
    setSelectedContact(contact);
    setFormData({ name: contact.name, phone: contact.phone });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading contacts...</div>
      </div>
    );
  }

  const handleAddContactClick = () => {
    console.log('Add Contact button clicked - handler called');
    setShowCreateModal(true);
  };

  const handleBulkCreateClick = () => {
    console.log('Bulk Create button clicked - handler called');
    setShowBulkModal(true);
  };

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBulkCreateClick}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm cursor-pointer relative z-50"
          >
            Bulk Create
          </button>
          <button
            type="button"
            onClick={handleAddContactClick}
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm flex items-center gap-2 cursor-pointer relative z-50"
          >
            <PlusIcon className="w-5 h-5" />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No contacts found</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors cursor-pointer"
          >
            Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-4">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreateModal(false);
            setFormData({ name: "", phone: "" });
          }
        }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Contact</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", phone: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
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
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
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
                    setFormData({ name: "", phone: "" });
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

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Create Contacts</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkData("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacts (Format: Name,Phone - one per line)
                </label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
                  rows={10}
                  placeholder="John Doe,+254712345678&#10;Jane Smith,+254798765432"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter contacts in format: Name,Phone (one per line)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Create All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkData("");
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
      {showEditModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Contact</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedContact(null);
                  setFormData({ name: "", phone: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
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
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
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
                    setSelectedContact(null);
                    setFormData({ name: "", phone: "" });
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
