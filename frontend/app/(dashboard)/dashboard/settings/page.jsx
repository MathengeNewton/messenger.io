"use client";
import { useState, useEffect } from "react";
import { apiClient } from "../../../../lib/api";
import { toast } from "react-toastify";
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({
    provider: "CUSTOM",
    apiKey: "",
    apiSecret: "",
    apiUrl: "",
    senderId: "",
  });
  const [balance, setBalance] = useState(0);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
    loadBalance();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.smsProvider.getConfig();
      // Backend returns { message: '...', config: null } or { ...safeConfig, hasApiKey, hasApiSecret }
      const configData = response.data.config || (response.data.message ? null : response.data);
      
      if (configData && configData.id) {
        setConfig(configData);
        // If API keys are masked (hasApiKey/hasApiSecret), keep existing values or use empty
        // User will need to re-enter if they want to change
        setFormData({
          provider: configData.provider || "CUSTOM",
          apiKey: formData.apiKey || (configData.hasApiKey ? "" : ""),
          apiSecret: formData.apiSecret || (configData.hasApiSecret ? "" : ""),
          apiUrl: configData.apiUrl || "",
          senderId: configData.senderId || "",
        });
      } else {
        // Config doesn't exist yet, use defaults
        setConfig(null);
        setFormData({
          provider: "CUSTOM",
          apiKey: "",
          apiSecret: "",
          apiUrl: "",
          senderId: "",
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
      // Don't show error toast if config just doesn't exist
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || "Failed to load SMS configuration");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await apiClient.smsProvider.getBalance();
      setBalance(response.data?.balance || 0);
    } catch (error) {
      console.error("Error loading balance:", error);
      setBalance(0);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Prepare data - only send fields that have values
      const saveData = {
        provider: formData.provider,
        senderId: formData.senderId,
      };
      
      // Only include API key/secret if they were provided (not empty)
      if (formData.apiKey && formData.apiKey.trim()) {
        saveData.apiKey = formData.apiKey;
      }
      if (formData.apiSecret && formData.apiSecret.trim()) {
        saveData.apiSecret = formData.apiSecret;
      }
      if (formData.apiUrl && formData.apiUrl.trim()) {
        saveData.apiUrl = formData.apiUrl;
      }
      
      const response = config && config.id
        ? await apiClient.smsProvider.updateConfig(config.id, saveData)
        : await apiClient.smsProvider.createOrUpdateConfig(saveData);
      
      toast.success("SMS provider configuration saved!");
      // Reset form to clear API keys after save
      setFormData(prev => ({
        ...prev,
        apiKey: "",
        apiSecret: "",
      }));
      await loadConfig();
      await loadBalance();
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save configuration";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) {
      toast.error("Please enter a phone number");
      return;
    }
    try {
      setTesting(true);
      await apiClient.smsProvider.testSms({ phone: testPhone, message: "Test message from Messenger.io" });
      toast.success("Test SMS sent successfully!");
      await loadBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send test SMS");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="w-full lg:p-2 space-y-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your SMS provider and preferences</p>
      </div>

      {/* SMS Balance Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">SMS Balance</h3>
            <p className="text-3xl font-bold text-blue-600">{balance.toFixed(2)}</p>
          </div>
          <button
            onClick={loadBalance}
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-[#1e88b5] transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* SMS Provider Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">SMS Provider Configuration</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="CUSTOM">Custom HTTP API</option>
              <option value="AFRICASTALKING">Africa's Talking</option>
              <option value="TWILIO">Twilio</option>
              <option value="BULKSMS">BulkSMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key / Username
            </label>
            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter API key or username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Secret / Password
            </label>
            <input
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter API secret or password"
            />
          </div>

          {formData.provider === "CUSTOM" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="https://api.example.com/send"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sender ID
            </label>
            <input
              type="text"
              value={formData.senderId}
              onChange={(e) => setFormData({ ...formData, senderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter sender ID"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-[#1e88b5] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>

      {/* Test SMS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test SMS</h2>
        <div className="flex gap-2">
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter phone number (e.g., +254712345678)"
          />
          <button
            onClick={handleTest}
            disabled={testing || !config}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {testing ? "Sending..." : "Send Test SMS"}
          </button>
        </div>
        {!config && (
          <p className="text-sm text-yellow-600 mt-2">
            Please configure SMS provider first
          </p>
        )}
      </div>
    </div>
  );
}
