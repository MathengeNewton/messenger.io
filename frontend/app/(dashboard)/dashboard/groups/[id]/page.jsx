"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../../lib/api";
import { toast } from "react-toastify";
import {
  UserGroupIcon,
  UserIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id);
  const [group, setGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadAllContacts();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const response = await apiClient.groups.getById(groupId);
      setGroup(response.data);
      setContacts(response.data?.contacts || []);
    } catch (error) {
      console.error("Error loading group:", error);
      toast.error(error.response?.data?.message || "Failed to load group");
      router.push("/dashboard/groups");
    } finally {
      setLoading(false);
    }
  };

  const loadAllContacts = async () => {
    try {
      const response = await apiClient.contacts.getAll({ page: 1, limit: 1000 });
      setAllContacts(response.data?.data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

  const handleAddContacts = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    try {
      await apiClient.groups.addContacts(groupId, {
        contactIds: selectedContacts,
      });
      toast.success(`Added ${selectedContacts.length} contact(s) to group`);
      setShowAddModal(false);
      setSelectedContacts([]);
      loadGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contacts");
    }
  };

  const handleRemoveContact = async (contactId) => {
    if (!confirm("Remove this contact from the group?")) return;

    try {
      await apiClient.groups.removeContact(groupId, contactId);
      toast.success("Contact removed from group");
      loadGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove contact");
    }
  };

  const filteredContacts = allContacts.filter(
    (contact) =>
      !contacts.some((c) => c.id === contact.id) &&
      (search === "" ||
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone.includes(search))
  );

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/groups")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Groups
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mt-1">{group.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in this group
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Contacts
          </button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No contacts in this group</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors"
          >
            Add Contacts
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
                    <button
                      onClick={() => handleRemoveContact(contact.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove from group"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contacts Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Contacts to Group</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedContacts([]);
                  setSearch("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
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

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-4">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {search ? "No contacts found matching your search" : "All contacts are already in this group"}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={
                            filteredContacts.length > 0 &&
                            filteredContacts.every((c) => selectedContacts.includes(c.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts(filteredContacts.map((c) => c.id));
                            } else {
                              setSelectedContacts([]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContacts([...selectedContacts, contact.id]);
                              } else {
                                setSelectedContacts(
                                  selectedContacts.filter((id) => id !== contact.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{contact.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedContacts.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} selected
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddContacts}
                disabled={selectedContacts.length === 0}
                className="flex-1 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedContacts.length})
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedContacts([]);
                  setSearch("");
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


