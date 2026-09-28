import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export interface InboundMessage {
  id: string;
  fromEmail: string;
  fromName: string;
  company: string;
  targetAccount: string;
  subject: string;
  body: string;
  receivedAt: string;
  unread: boolean;
  sentiment: "positive" | "inquiry" | "neutral";
  category: string;
}

export function AdminInboxTab() {
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<InboundMessage | null>(null);

  // Reply generator state
  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/sales-agent/inbox");
      const data = await resp.json();
      if (data.ok && data.messages) {
        setMessages(data.messages);
        setUnreadCount(data.unreadCount || 0);
        setSelectedMsg((prev) => prev || (data.messages.length > 0 ? data.messages[0] : null));
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox]);

  // Update reply draft whenever selected message changes
  useEffect(() => {
    if (!selectedMsg) return;

    const firstName = selectedMsg.fromName.split(" ")[0] || "there";
    const sub = selectedMsg.subject.startsWith("Re:")
      ? selectedMsg.subject
      : `Re: ${selectedMsg.subject}`;
    setReplySubject(sub);

    const isWow =
      selectedMsg.fromEmail.includes("wowcarwash") ||
      selectedMsg.company.toLowerCase().includes("wow") ||
      selectedMsg.fromName.includes("Pomerantz");

    let draft = "";
    if (isWow) {
      draft = `Hi Howard,

Thank you for reaching out! We ran the preliminary StackQuote™ BESS + Solar financial model specifically for your WOW Carwash Spring Mountain location in Las Vegas.

Here is the executive summary of your pre-built financial model:

• Facility: WOW Carwash — Spring Mountain Rd, Las Vegas, NV
• Recommended System: 180 kW / 360 kWh BESS + 45 kW Solar PV (Rooftop & Canopy Array)
• Annual Savings: $57,780 / year ($47,520 demand charge peak shaving + $10,260 solar offset)
• Net Investment (after 30% IRA Tax Credit): $173,250
• Simple Payback Period: 3.0 Years (Well under your 5-year target threshold!)
• 25-Year Cumulative Net Savings (NPV): $685,000

You can review the full interactive StackQuote™ financial breakdown and 25-year ROI model for your site here:
https://merlinenergy.net/quote/wow-carwash-spring-mountain

Would you or your operations board have 10 minutes for a brief call this Thursday to walk through the line-item assumptions?

Best regards,

Bob Christopher
Merlin Energy
bob@merlinenergy.net
merlinenergy.net`;
    } else {
      draft = `Hi ${firstName},

Thank you for replying regarding ${selectedMsg.company}. 

We have prepared the preliminary StackQuote™ energy financial model for your site. The calculations factor in local utility tariff schedules, peak demand shaving, and 30-50% IRA Investment Tax Credit (ITC) qualification.

Would you be open to a brief 10-minute executive call this week to review the preliminary numbers?

Bob Christopher
Merlin Energy
bob@merlinenergy.net
merlinenergy.net`;
    }

    setReplyBody(draft);
    setSendSuccess(false);
    setSendError(null);

    // Mark as read
    if (selectedMsg.unread) {
      fetch("/api/sales-agent/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: selectedMsg.id }),
      }).catch(() => {});
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMsg.id ? { ...m, unread: false } : m))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }, [selectedMsg]);

  const handleSendReply = async () => {
    if (!selectedMsg || !replyBody.trim()) return;
    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const resp = await fetch("/api/sales-agent/send-direct-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: selectedMsg.fromEmail,
          recipientName: selectedMsg.fromName,
          company: selectedMsg.company,
          subject: replySubject.trim(),
          body: replyBody.trim(),
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to deliver email reply");
      }

      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${replySubject}\n\n${replyBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Inbound Sales Inbox</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                bob@merlinenergy.net
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live prospect replies and inquiries received at{" "}
              <span className="text-slate-200 font-semibold">bob@merlinenergy.net</span> &{" "}
              <span className="text-slate-200 font-semibold">sales@merlinenergy.net</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Unread Replies</div>
            <div className="text-lg font-black text-emerald-400">{unreadCount} Pending</div>
          </div>
          <button
            onClick={fetchInbox}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
            />
            Refresh Inbox
          </button>
        </div>
      </div>

      {/* Main Inbox Layout (Left List, Right Reader) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left List Pane (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>PROSPECT REPLIES ({messages.length})</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {unreadCount} UNREAD
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No prospect emails received yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMsg?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsg(msg)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-800/60 ${
                      isSelected ? "bg-slate-800/90 border-l-4 border-l-emerald-400" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {msg.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                        )}
                        <span className="text-sm font-bold text-white truncate">
                          {msg.fromName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(msg.receivedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {msg.company}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {msg.category}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-300 truncate mb-1">
                      {msg.subject}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {msg.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Reader & AI Reply Pane (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedMsg ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
              {/* Message Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {selectedMsg.company}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedMsg.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                    {selectedMsg.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{selectedMsg.subject}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-white">{selectedMsg.fromName}</span>
                  <span className="text-slate-500">&lt;{selectedMsg.fromEmail}&gt;</span>
                </div>
              </div>

              {/* Prospect Message Body */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedMsg.body}
              </div>

              {/* AI Reply & Email Dispatch Controls */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Send Reply from bob@merlinenergy.net
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 font-semibold"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copied ? "Copied" : "Copy Reply"}
                  </button>
                </div>

                {/* Reply Subject */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Reply Subject Line
                  </label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Reply Body Textarea */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Reply Email Body (Editable)
                  </label>
                  <textarea
                    rows={8}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Send Reply Button & Status */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {sendSuccess && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Reply delivered to{" "}
                        {selectedMsg.fromEmail}!
                      </span>
                    )}
                    {sendError && (
                      <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {sendError}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyBody.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Delivering Reply...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Reply Direct (Resend API)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-700" />
              <p className="text-sm font-semibold">
                Select a prospect email reply to view & respond
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInboxTab;
