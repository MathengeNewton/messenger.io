"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function MessengerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSmsSent: 0,
    totalGroups: 0,
    totalContacts: 0,
    smsBalance: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    messagesThisMonth: 0,
    failedMessages: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard metrics
      const metricsRes = await apiClient.dashboard.getMetrics();
      setMetrics(metricsRes.data);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Messenger.io Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your messaging platform overview.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/messages"
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm"
          >
            Send Message
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total SMS Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalSmsSent.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ChatBubbleLeftRightIcon className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalGroups}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UserGroupIcon className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalContacts}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserIcon className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SMS Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.smsBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CurrencyDollarIcon className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Messages Today</p>
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.messagesToday}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Messages This Week</p>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.messagesThisWeek}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Messages This Month</p>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.messagesThisMonth}
          </p>
        </div>
      </div>

      {/* Failed Messages Alert */}
      {metrics.failedMessages > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Failed Messages Alert
              </h3>
              <p className="text-sm text-yellow-800">
                You have {metrics.failedMessages} failed message{metrics.failedMessages !== 1 ? 's' : ''}. 
                <Link href="/dashboard/messages" className="underline ml-1 font-medium">
                  View and resend them
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/groups"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Manage Groups</h3>
          </div>
          <p className="text-sm text-gray-600">Create and manage contact groups for messaging</p>
        </Link>

        <Link
          href="/dashboard/contacts"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <UserIcon className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-900">Manage Contacts</h3>
          </div>
          <p className="text-sm text-gray-600">Add, edit, and organize your contacts</p>
        </Link>

        <Link
          href="/dashboard/messages"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Send Messages</h3>
          </div>
          <p className="text-sm text-gray-600">Send instant or scheduled messages to contacts or groups</p>
        </Link>
      </div>
    </div>
  );
}
