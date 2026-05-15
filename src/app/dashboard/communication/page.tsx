"use client";

import { fetchAllHostUids } from "@/app/service";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { Bell, MessageSquare, Send, Users, X } from "lucide-react";
import { useState } from "react";

const SUPPORT_UID = "support";

type RecipientMode = "all_hosts" | "all_users" | "custom";
type ActionTab = "notification" | "message";

async function getUsersForMode(mode: RecipientMode, customUids: string[]): Promise<string[]> {
  if (mode === "all_hosts") return fetchAllHostUids();
  if (mode === "custom") return customUids.filter((u) => u.trim().length > 0);
  // all_users
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.id);
}

export default function CommunicationPage() {
  const [tab, setTab] = useState<ActionTab>("notification");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all_hosts");
  const [customInput, setCustomInput] = useState("");

  // Notification fields
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");

  // Message field
  const [msgBody, setMsgBody] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const customUids = customInput
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setSending(true);
    setResult(null);

    const uids = await getUsersForMode(recipientMode, customUids);
    let sent = 0, failed = 0;

    for (const uid of uids) {
      try {
        const res = await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "admin_broadcast",
            recipientId: uid,
            title: notifTitle.trim(),
            body: notifBody.trim(),
            data: { type: "admin_broadcast" },
          }),
        });
        if (res.ok) sent++; else failed++;
      } catch { failed++; }
    }

    setResult({ sent, failed, total: uids.length });
    setSending(false);
  };

  const handleSendMessage = async () => {
    if (!msgBody.trim()) return;
    setSending(true);
    setResult(null);

    const uids = await getUsersForMode(recipientMode, customUids);
    let sent = 0, failed = 0;

    for (const uid of uids) {
      try {
        const chatId = `${uid}_support`;

        // Fetch user's real name
        const userSnap = await getDoc(doc(db, "users", uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const userName =
          (userData["1_name"] as string) ||
          (userData["name"] as string) ||
          "User";

        // Upsert chat document — only set user1.name if creating new chat
        // (merge:true will not overwrite existing name if chat already exists,
        //  but we explicitly set it so new chats get the real name)
        await setDoc(
          doc(db, "Chats", chatId),
          {
            user1: { uid, name: userName, image: "", badges: 1 },
            user2: { uid: SUPPORT_UID, name: "Marhabten Support", image: "", badges: 0 },
            lastMessage: msgBody.trim(),
            DateTime: Timestamp.now(),
            users: [uid, SUPPORT_UID],
          },
          { merge: true }
        );

        // Add message to subcollection
        await addDoc(collection(db, "Chats", chatId, "messages"), {
          message: msgBody.trim(),
          sendby: SUPPORT_UID,
          time: Timestamp.now(),
          type: "text",
        });

        // Also send a push notification for the message
        await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "message",
            recipientId: uid,
            title: "Marhabten Support",
            body: msgBody.trim(),
            data: { chatId, senderId: SUPPORT_UID, senderName: "Marhabten Support" },
          }),
        });

        sent++;
      } catch { failed++; }
    }

    setResult({ sent, failed, total: uids.length });
    setSending(false);
  };

  const recipientLabel =
    recipientMode === "all_hosts"
      ? "All Hosts"
      : recipientMode === "all_users"
      ? "All Users"
      : `${customUids.length} custom UID(s)`;

  return (
    <div className="mt-12 md:mt-0 p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Communication</h1>
      <p className="text-sm text-gray-500 mb-6">
        Send push notifications or in-app messages to users.
      </p>

      {/* Action tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("notification")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "notification" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell size={15} /> Push Notification
        </button>
        <button
          onClick={() => setTab("message")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "message" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare size={15} /> In-App Message
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Users size={14} /> Recipients
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(["all_hosts", "all_users", "custom"] as RecipientMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setRecipientMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  recipientMode === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {m === "all_hosts" ? "All Hosts" : m === "all_users" ? "All Users" : "Custom UIDs"}
              </button>
            ))}
          </div>
          {recipientMode === "custom" && (
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={"Paste user UIDs separated by newline or comma…"}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          )}
          {recipientMode !== "custom" && (
            <p className="text-xs text-gray-400 mt-1">
              {recipientMode === "all_hosts"
                ? "Targets every user who owns at least one listed property."
                : "Targets every registered user in the database."}
            </p>
          )}
        </div>

        {/* Notification fields */}
        {tab === "notification" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notification Title</label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="e.g. Important Update"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notification Body</label>
              <textarea
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Write the notification message…"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </>
        )}

        {/* Message field */}
        {tab === "message" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
            <textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Write your message…"
              rows={4}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              This creates or updates a support chat with each recipient and sends them a push notification.
            </p>
          </div>
        )}

        {/* Result banner */}
        {result && (
          <div className={`flex items-center justify-between text-sm px-4 py-2.5 rounded-lg border ${
            result.failed === 0
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}>
            <span>
              Sent to <strong>{result.sent}</strong> of <strong>{result.total}</strong> recipients
              {result.failed > 0 && ` · ${result.failed} failed`}
            </span>
            <button onClick={() => setResult(null)} className="ml-4 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={tab === "notification" ? handleSendNotification : handleSendMessage}
          disabled={
            sending ||
            (tab === "notification" && (!notifTitle.trim() || !notifBody.trim())) ||
            (tab === "message" && !msgBody.trim()) ||
            (recipientMode === "custom" && customUids.length === 0)
          }
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending to {recipientLabel}…
            </>
          ) : (
            <>
              <Send size={15} />
              Send {tab === "notification" ? "Notification" : "Message"} to {recipientLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
