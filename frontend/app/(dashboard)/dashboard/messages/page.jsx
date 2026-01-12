"use client";
import { useState, useEffect } from "react";
import { apiClient } from "../../../../lib/api";
import { toast } from "react-toastify";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    recipientType: "GROUP",
    recipientId: "",
    scheduledAt: "",
  });

  useEffect(() => {
    loadMessages();
    loadGroups();
    loadContacts();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.messages.getAll({ page: 1, limit: 50 });
      setMessages(response.data?.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await apiClient.groups.getAll();
      setGroups(response.data || []);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await apiClient.contacts.getAll({ page: 1, limit: 100 });
      setContacts(response.data?.data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        body: formData.body,
        recipientType: formData.recipientType,
        recipientId: parseInt(formData.recipientId),
      };

      if (formData.scheduledAt) {
        payload.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      await apiClient.messages.create(payload);
      toast.success("Message sent successfully!");
      setShowSendForm(false);
      setFormData({
        title: "",
        body: "",
        recipientType: "GROUP",
        recipientId: "",
        scheduledAt: "",
      });
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SENT":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "FAILED":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case "SCHEDULED":
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Messages
          </h1>
          <p className="text-gray-600 mt-1">Send and manage your SMS messages</p>
        </div>
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm flex items-center gap-2"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
          {showSendForm ? "Cancel" : "Send Message"}
        </button>
      </div>

      {/* Send Message Form */}
      {showSendForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send New Message</h2>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Message title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={4}
                placeholder="Enter your message here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.body.length} characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To
                </label>
                <select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, recipientId: "" })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="GROUP">Group</option>
                  <option value="CONTACT">Contact</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.recipientType === "GROUP" ? "Select Group" : "Select Contact"}
                </label>
                <select
                  value={formData.recipientId}
                  onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Select {formData.recipientType === "GROUP" ? "Group" : "Contact"}</option>
                  {formData.recipientType === "GROUP"
                    ? groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.contactCount || 0} contacts)
                        </option>
                      ))
                    : contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} - {contact.phone}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={!!formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledAt: e.target.checked ? new Date(Date.now() + 3600000).toISOString().slice(0, 16) : "",
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Schedule for later</span>
              </label>
              {formData.scheduledAt && (
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors"
              >
                {formData.scheduledAt ? "Schedule Message" : "Send Now"}
              </button>
              <button
                type="button"
                onClick={() => setShowSendForm(false)}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No messages yet</p>
          <button
            onClick={() => setShowSendForm(true)}
            className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors"
          >
            Send Your First Message
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((message) => (
                <tr key={message.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{message.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {message.body.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {message.recipientType} #{message.recipientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          message.status
                        )}`}
                      >
                        {message.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {message.sentAt
                      ? new Date(message.sentAt).toLocaleString()
                      : message.scheduledAt
                      ? `Scheduled: ${new Date(message.scheduledAt).toLocaleString()}`
                      : new Date(message.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <a
                        href={`/dashboard/messages/${message.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </a>
                      {message.status === "FAILED" && (
                        <button
                          onClick={async () => {
                            try {
                              await apiClient.messages.resend(message.id);
                              toast.success("Message resent!");
                              loadMessages();
                            } catch (error) {
                              toast.error(error.response?.data?.message || "Failed to resend message");
                            }
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          Resend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
