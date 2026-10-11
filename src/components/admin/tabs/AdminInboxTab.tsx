import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ExternalLink,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Unlock,
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
  status?: "replied" | "pending";
  repliedAt?: string | null;
  direction?: "inbound" | "outbound";
  folder?: "inbox" | "junk";
  threadEmail?: string;
  toEmails?: string[];
}

export interface CustomerThread {
  threadId: string;
  customerName: string;
  company: string;
  customerEmail: string;
  targetAccount: string;
  subject: string;
  lastActivityAt: string;
  unreadCount: number;
  status: "replied" | "pending";
  messages: InboundMessage[]; // Sorted chronologically (oldest to newest)
}

const OTHER_ACCOUNT_DOMAINS = [
  "readyforrobots.com",
  "reply.readyforrobots.com",
  "orbital-ai.io",
  "pythh.ai",
  "pyth.ai",
  "onstage.bot",
];
const BULK_SENDER_DOMAINS = [
  "substack.com",
  "eventbrite.com",
  "wistia.live",
  "sendfoxmail.com",
  "probusinesstravel.com",
];
const AUTO_PREFIXES = [
  "noreply@",
  "no-reply@",
  "notifications@",
  "notification@",
  "mailer-daemon@",
  "postmaster@",
  "marketing@",
];
const SEED_IDS = new Set([
  "msg-001",
  "msg-001-out",
  "msg-002",
  "msg-002-out",
  "msg-003",
  "msg-003-out",
]);

function emailDomain(addr: string): string {
  const match = (addr || "").toLowerCase().match(/@([a-z0-9.-]+)/);
  return match ? match[1] : "";
}

function domainMatches(addr: string, domains: string[]): boolean {
  const domain = emailDomain(addr);
  return domains.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
}

function messageFolder(msg: InboundMessage): "inbox" | "junk" {
  if (SEED_IDS.has(msg.id)) return "junk";
  if (msg.folder === "inbox" || msg.folder === "junk") return msg.folder;
  if (msg.direction === "outbound") return "inbox";
  const from = msg.fromEmail || "";
  if (!emailDomain(from)) return "junk";
  if (domainMatches(from, OTHER_ACCOUNT_DOMAINS)) return "junk";
  if (domainMatches(from, BULK_SENDER_DOMAINS)) return "junk";
  if (AUTO_PREFIXES.some((prefix) => from.toLowerCase().includes(prefix))) return "junk";
  if (emailDomain(from) === "merlinenergy.net") return "junk";
  const recipients = msg.toEmails || [];
  if (
    recipients.length > 0 &&
    !recipients.some((addr) => emailDomain(addr) === "merlinenergy.net")
  ) {
    return "junk";
  }
  return "inbox";
}

function partyEmail(msg: InboundMessage): string {
  if (msg.direction === "outbound") {
    return (msg.threadEmail || msg.targetAccount || "").toLowerCase();
  }
  return (msg.fromEmail || "").toLowerCase();
}

export function AdminInboxTab() {
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mailbox, setMailbox] = useState<"inbox" | "junk">("inbox");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "replied">("all");
  const [checkedThreadIds, setCheckedThreadIds] = useState<Set<string>>(new Set());
  const replyComposerRef = useRef<HTMLDivElement>(null);

  // Reply Composer State
  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allowFollowUp, setAllowFollowUp] = useState(false);

  // Helper for reading deleted IDs from localStorage
  const getDeletedIds = (): string[] => {
    try {
      const raw = localStorage.getItem("merlin_deleted_msg_ids");
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  // Group raw messages into Customer Threads
  const groupMessagesIntoThreads = (rawMessages: InboundMessage[]): CustomerThread[] => {
    const threadMap = new Map<string, InboundMessage[]>();

    for (const msg of rawMessages) {
      const emailKey = partyEmail(msg);
      const domainMatch = emailKey.match(/@([^>\s]+)/);
      const groupKey = domainMatch
        ? domainMatch[1]
        : (msg.company || emailKey || "unknown").toLowerCase().trim();

      if (!threadMap.has(groupKey)) {
        threadMap.set(groupKey, []);
      }
      threadMap.get(groupKey)!.push(msg);
    }

    const result: CustomerThread[] = [];

    threadMap.forEach((msgs, groupKey) => {
      msgs.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

      const primaryInbound = msgs.find((m) => m.direction !== "outbound") || msgs[msgs.length - 1];
      const outbound = msgs.find((m) => m.direction === "outbound");
      const latestMsg = msgs[msgs.length - 1];
      const customerEmail =
        (primaryInbound.direction !== "outbound" ? primaryInbound.fromEmail : "") ||
        outbound?.threadEmail ||
        outbound?.targetAccount ||
        primaryInbound.fromEmail;

      const unreadCount = msgs.filter((m) => m.unread && m.direction !== "outbound").length;
      const isReplied = msgs.some((m) => m.status === "replied" || m.direction === "outbound");

      result.push({
        threadId: groupKey,
        customerName:
          primaryInbound.direction === "outbound"
            ? primaryInbound.company || "Prospect"
            : primaryInbound.fromName || "Prospect Lead",
        company: primaryInbound.company || "Target Facility",
        customerEmail,
        targetAccount: primaryInbound.targetAccount || primaryInbound.company,
        subject:
          (primaryInbound.direction !== "outbound" ? primaryInbound.subject : outbound?.subject) ||
          primaryInbound.subject,
        lastActivityAt: latestMsg.receivedAt,
        unreadCount,
        status: isReplied ? "replied" : "pending",
        messages: msgs,
      });
    });

    result.sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
    return result;
  };

  const threads = groupMessagesIntoThreads(
    messages.filter((msg) => messageFolder(msg) === mailbox)
  );
  const inboxCount = messages.filter((msg) => messageFolder(msg) === "inbox").length;
  const junkCount = messages.filter((msg) => messageFolder(msg) === "junk").length;

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/sales-agent/inbox");
      const data = await resp.json();
      if (data.ok && data.messages) {
        const deletedSet = new Set(getDeletedIds());
        setMessages(data.messages.filter((m: InboundMessage) => !deletedSet.has(m.id)));
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

  const activeThread = threads.find((t) => t.threadId === selectedThreadId) || null;
  const activeThreadId = activeThread?.threadId ?? null;

  const visibleThreadKey = threads.map((t) => t.threadId).join("|");
  useEffect(() => {
    if (threads.length > 0 && !threads.some((t) => t.threadId === selectedThreadId)) {
      setSelectedThreadId(threads[0].threadId);
    }
    // visibleThreadKey is the stable stand-in for the thread list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleThreadKey, selectedThreadId]);

  // Draft only when the open thread changes. Appending a sent reply must not
  // replace the composer with the next canned response.
  useEffect(() => {
    if (!activeThreadId) return;
    const thread = threads.find((t) => t.threadId === activeThreadId);
    if (!thread) return;

    setAllowFollowUp(false);
    setSendSuccess(false);
    setSendError(null);

    if (mailbox === "junk") {
      setReplySubject("");
      setReplyBody("");
      return;
    }

    const sub = thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`;
    setReplySubject(sub);

    const alreadySent = thread.messages.some((m) => m.direction === "outbound");
    if (alreadySent) {
      setReplyBody("");
      return;
    }

    const firstName = thread.customerName.split(" ")[0] || "there";
    setReplyBody(`Hi ${firstName},

Thanks for reaching out regarding ${thread.company}.

Would you have 10-15 minutes for a call this week to review the preliminary StackQuote™ energy financial model for your site?

Let me know a few times that work for you.

Best regards,

Bob Christopher
Merlin Energy
bob@merlinenergy.net
merlinenergy.net`);

    const unreadMsgs = thread.messages.filter((m) => m.unread);
    for (const msg of unreadMsgs) {
      fetch("/api/sales-agent/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id }),
      }).catch(() => {});
    }
    // Intentionally keyed to the thread id, not the thread object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, mailbox]);

  const handleSendReply = async () => {
    if (!activeThread || !replyBody.trim()) return;
    setSending(true);
    setSendError(null);

    const nowIso = new Date().toISOString();

    try {
      const resp = await fetch("/api/sales-agent/send-direct-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: activeThread.messages[activeThread.messages.length - 1]?.id,
          recipientEmail: activeThread.customerEmail,
          recipientName: activeThread.customerName,
          company: activeThread.company,
          subject: replySubject.trim(),
          body: replyBody.trim(),
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to deliver email reply");
      }

      // Construct new outbound message to immediately append to UI thread
      const newOutboundMsg: InboundMessage = data.outboundMsg || {
        id: `out-${Date.now()}`,
        fromEmail: "Merlin Energy <hello@merlinenergy.net>",
        fromName: "Bob Christopher (Merlin Energy)",
        company: activeThread.company,
        targetAccount: activeThread.customerEmail,
        threadEmail: activeThread.customerEmail,
        subject: replySubject.trim(),
        body: replyBody.trim(),
        receivedAt: nowIso,
        unread: false,
        sentiment: "positive",
        category: "Outbound Reply",
        direction: "outbound",
        status: "replied",
        folder: "inbox",
      };

      setMessages((prev) => {
        const withoutDup = prev.filter((m) => m.id !== newOutboundMsg.id);
        return [newOutboundMsg, ...withoutDup];
      });
      setReplyBody("");
      setSendSuccess(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSingleThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this customer thread?")) return;

    const threadToDelete = threads.find((t) => t.threadId === threadId);
    if (!threadToDelete) return;

    const idsToDelete = threadToDelete.messages.map((m) => m.id);

    try {
      const existing = getDeletedIds();
      const updated = Array.from(new Set([...existing, ...idsToDelete]));
      localStorage.setItem("merlin_deleted_msg_ids", JSON.stringify(updated));
    } catch (_) {}

    setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
    }

    try {
      await fetch("/api/sales-agent/delete-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: idsToDelete }),
      });
    } catch (err) {
      console.error("Failed to delete thread on server:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${replySubject}\n\n${replyBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

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
              <h2 className="text-xl font-bold text-white">
                Inbound Sales Inbox & Customer Threads
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                bob@merlinenergy.net
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Recorded customer email conversations & replies at{" "}
              <span className="text-slate-200 font-semibold">bob@merlinenergy.net</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400 font-semibold">Active Customer Threads</div>
            <div className="text-lg font-black text-emerald-400">{threads.length} Accounts</div>
          </div>

          <button
            onClick={fetchInbox}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
            />
            Refresh Inbox
          </button>
        </div>
      </div>

      {/* Main Layout (Left Threads Directory, Right Full Thread Reader) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left List Pane: Customer Threads (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex flex-col gap-2 text-xs text-slate-400 font-semibold">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">
                  CUSTOMER THREADS ({threads.length})
                </span>
              </div>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                  {totalUnread} UNREAD
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setMailbox("inbox")}
                className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                  mailbox === "inbox"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Leads ({inboxCount})
              </button>
              <button
                onClick={() => setMailbox("junk")}
                className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                  mailbox === "junk"
                    ? "bg-slate-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Junk ({junkCount})
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setFilterMode("all")}
                className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                  filterMode === "all"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({threads.length})
              </button>
              <button
                onClick={() => setFilterMode("pending")}
                className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                  filterMode === "pending"
                    ? "bg-amber-600 text-white shadow"
                    : "text-slate-400 hover:text-amber-400"
                }`}
              >
                Pending ({threads.filter((t) => t.status === "pending").length})
              </button>
              <button
                onClick={() => setFilterMode("replied")}
                className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                  filterMode === "replied"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                Replied ({threads.filter((t) => t.status === "replied").length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {mailbox === "junk"
                  ? "Junk is empty."
                  : "No Merlin leads yet. Other mail is in Junk."}
              </div>
            ) : (
              threads
                .filter((t) => {
                  if (filterMode === "pending") return t.status === "pending";
                  if (filterMode === "replied") return t.status === "replied";
                  return true;
                })
                .map((thread) => {
                  const isSelected = activeThread?.threadId === thread.threadId;
                  const latestMsg = thread.messages[thread.messages.length - 1];
                  const hasUnread = thread.unreadCount > 0;

                  return (
                    <div
                      key={thread.threadId}
                      onClick={() => setSelectedThreadId(thread.threadId)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-800/60 relative group ${
                        isSelected ? "bg-slate-800/90 border-l-4 border-l-emerald-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {hasUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                          )}
                          <span className="text-sm font-bold text-white truncate">
                            {thread.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {new Date(thread.lastActivityAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={(e) => handleDeleteSingleThread(thread.threadId, e)}
                            title="Delete customer thread"
                            className="p-1 rounded hover:bg-red-900/50 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" /> {thread.company}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-400" />{" "}
                            {thread.messages.length} msgs
                          </span>
                          {thread.status === "replied" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> [replied]
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-400" /> [pending]
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-300 truncate mb-1">
                        {thread.subject}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {latestMsg?.direction === "outbound" ? "📤 Sent: " : "📥 Received: "}
                        {latestMsg?.body}
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Pane: Full Customer Conversation History & Inline Reply Composer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {activeThread ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
              {/* Thread Header */}
              <div className="border-b border-slate-800 pb-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {activeThread.company}
                    </span>
                    <span className="text-xs text-slate-400">
                      Thread History ({activeThread.messages.length} messages exchanged)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeThread.status === "replied" ? (
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Replied ✅
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Action Required
                      </span>
                    )}

                    <button
                      onClick={() =>
                        replyComposerRef.current?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Send className="w-3 h-3" /> Reply
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{activeThread.subject}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-white">{activeThread.customerName}</span>
                  <span className="text-slate-500">&lt;{activeThread.customerEmail}&gt;</span>
                </div>
              </div>

              {/* Dedicated Interactive Proposal Link Banner */}
              {(() => {
                const isWow =
                  activeThread.customerEmail.includes("wowcarwash") ||
                  activeThread.company.toLowerCase().includes("wow") ||
                  activeThread.customerName.includes("Pomerantz");

                const isTerribleHerbst =
                  activeThread.customerEmail.includes("terribleherbst") ||
                  activeThread.company.toLowerCase().includes("terrible") ||
                  activeThread.customerName.includes("Vance");

                const isSarahLin =
                  activeThread.customerEmail.includes("dashcarwash") ||
                  activeThread.company.toLowerCase().includes("dash") ||
                  activeThread.customerName.includes("Lin");

                let prospectSlug = activeThread.company
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                if (isWow) prospectSlug = "wow-carwash-spring-mountain";
                if (isTerribleHerbst) prospectSlug = "terrible-herbst-jean";
                if (isSarahLin) prospectSlug = "sarah-lin-sce-portfolio";

                const quoteUrl = `https://merlinenergy.net/quote/${prospectSlug}`;

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" /> StackQuote™ Interactive
                          Proposal Live
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                          Ready for Client
                        </span>
                      </div>
                      <a
                        href={`/quote/${prospectSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1"
                      >
                        {quoteUrl} ↗
                      </a>
                    </div>
                    <a
                      href={`/quote/${prospectSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Proposal ↗
                    </a>
                  </div>
                );
              })()}

              {/* Full Conversation Timeline Stack (Chronological Order: Oldest to Newest) */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Conversation History ({activeThread.messages.length} messages)</span>
                  <span className="text-slate-500 font-normal">Chronological Timeline</span>
                </div>

                {activeThread.messages.map((msg, index) => {
                  const isOutbound = msg.direction === "outbound";
                  return (
                    <div
                      key={msg.id || index}
                      className={`p-4.5 rounded-2xl border transition-all ${
                        isOutbound
                          ? "bg-slate-950/80 border-blue-500/40 ml-4 md:ml-8 shadow-md"
                          : "bg-slate-950/90 border-emerald-500/40 mr-4 md:mr-8 shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/60 flex-wrap">
                        <div className="flex items-center gap-2">
                          {isOutbound ? (
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                              📤 Sent by {msg.fromName || "Bob Christopher (Merlin Energy)"}
                            </span>
                          ) : (
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                              📥 Received from {msg.fromName} ({activeThread.company})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          {new Date(msg.receivedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-300 mb-2">
                        Subject: <span className="text-white">{msg.subject}</span>
                      </div>

                      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              {mailbox === "junk" ? (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-700 text-xs text-slate-400">
                  Filed in junk. This is not a Merlin lead, so it stays out of the lead inbox.
                </div>
              ) : null}

              {/* Inline Reply Composer */}
              {mailbox === "inbox" && (
                <div
                  ref={replyComposerRef}
                  className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4 pt-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Reply to {activeThread.customerName} (bob@merlinenergy.net)
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
                      disabled={sendSuccess && !allowFollowUp}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Reply Body Textarea */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Reply Email Body
                    </label>
                    <textarea
                      rows={7}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      disabled={sendSuccess && !allowFollowUp}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Send Reply Button & Delivery Confirmation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex-1">
                      {sendSuccess && !allowFollowUp && (
                        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span>✅ Outbound reply delivered & recorded in customer thread!</span>
                        </div>
                      )}
                      {sendError && (
                        <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          <span>{sendError}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {sendSuccess && !allowFollowUp ? (
                        <button
                          onClick={() => setAllowFollowUp(true)}
                          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                          title="Compose another follow-up email to this prospect"
                        >
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                          Send Additional Message
                        </button>
                      ) : (
                        <button
                          onClick={handleSendReply}
                          disabled={sending || !replyBody.trim()}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {sending ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              Delivering Reply via Resend...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Send Reply Direct (Resend API)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-700" />
              <p className="text-sm font-semibold">
                Select a customer thread to view complete email history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInboxTab;
