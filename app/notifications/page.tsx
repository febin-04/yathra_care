'use client';

import { useState, useEffect } from 'react';
import { NotificationItem } from '@/lib/escalation';
import { Mail, MessageSquare, Bell, ShieldAlert, Clock, RefreshCw, Send } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EMAIL' | 'SMS'>('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white rounded-3xl p-6 shadow-xl border border-brand-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-brand-300" />
            <h1 className="text-2xl font-black text-white">Dispatch Inbox</h1>
          </div>
          <p className="text-xs text-brand-100 mt-1">
            Automated SMS & Email alerts dispatched by the SLA Escalation Engine to Depot Officers & HQ Oversight.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'ALL'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('SMS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeTab === 'SMS'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>SMS Dispatches</span>
        </button>
        <button
          onClick={() => setActiveTab('EMAIL')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            activeTab === 'EMAIL'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Dispatch Log</span>
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-semibold">Loading Notification Audit Log...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 space-y-2 border border-slate-200">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No mock notifications sent yet.</p>
            <p className="text-xs text-slate-400">Use "Simulate Time (+12h)" in the header to trigger overdue escalations!</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3 relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  item.type === 'SMS' ? 'bg-amber-500' : 'bg-brand-600'
                }`}
              />

              <div className="flex justify-between items-start pl-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                      item.type === 'SMS'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    {item.type === 'SMS' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    {item.type} DISPATCH
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">{item.reference_number || 'SYSTEM'}</span>
                </div>

                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.sent_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="pl-2 space-y-1">
                <div className="text-xs font-bold text-slate-800">
                  Recipient: <span className="font-mono text-brand-700">{item.recipient}</span>
                </div>
                {item.subject && (
                  <div className="text-xs font-extrabold text-slate-900">{item.subject}</div>
                )}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
