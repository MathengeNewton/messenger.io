"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../../../lib/api";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export default function MessageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const messageId = parseInt(params.id);
  const [message, setMessage] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (messageId) {
      loadMessage();
      loadRecipients();
    }
  }, [messageId]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.messages.getById(messageId);
      setMessage(response.data);
    } catch (error) {
      console.error("Error loading message:", error);
      toast.error(error.response?.data?.message || "Failed to load message");
      router.push("/dashboard/messages");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await apiClient.messages.getRecipients(messageId);
      setRecipients(response.data || []);
    } catch (error) {
      console.error("Error loading recipients:", error);
    }
  };

  const handleResend = async () => {
    if (!confirm("Resend this message to all failed recipients?")) return;
    try {
      await apiClient.messages.resend(messageId);
      toast.success("Message resent successfully!");
      loadMessage();
      loadRecipients();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend message");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SENT":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "FAILED":
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case "DELIVERED":
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
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
      case "DELIVERED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "SENT" || r.status === "DELIVERED").length,
    failed: recipients.filter((r) => r.status === "FAILED").length,
    pending: recipients.filter((r) => r.status === "PENDING").length,
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading message details...</div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Messages
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{message.title}</h1>
            <p className="text-gray-600 mt-1">Message Details</p>
          </div>
          {message.status === "FAILED" && (
            <button
              onClick={handleResend}
              className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Resend Failed
            </button>
          )}
        </div>
      </div>

      {/* Message Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold inline-block ${getStatusColor(
              message.status
            )}`}>
              {message.status}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Recipient Type</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {message.recipientType} #{message.recipientId}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>
          {message.sentAt && (
            <div>
              <p className="text-sm text-gray-500">Sent At</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(message.sentAt).toLocaleString()}
              </p>
            </div>
          )}
          {message.scheduledAt && (
            <div>
              <p className="text-sm text-gray-500">Scheduled For</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(message.scheduledAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Message Body</p>
          <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Recipients</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
        </div>
        {recipients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No recipients found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {recipient.contact?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recipient.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(recipient.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          recipient.status
                        )}`}
                      >
                        {recipient.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {recipient.sentAt
                      ? new Date(recipient.sentAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                    {recipient.errorMessage || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

