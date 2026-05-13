'use client';

import { db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ArrowLeft, Image as ImageIcon, MessageSquare, Paperclip, Plus, Search, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SUPPORT_UID = 'support';

type ChatUser = { uid: string; name: string; image: string; badges: number };
type Message = { message: string; sendby: string; time: Timestamp | null; type: string };
type Chat = {
  id: string;
  user1: ChatUser;
  user2: ChatUser;
  lastMessage: string;
  DateTime: Timestamp | null;
  users: string[];
};
type FirestoreUser = { id: string; [key: string]: unknown };

function getPartner(chat: Chat): ChatUser {
  return chat.user1.uid === SUPPORT_UID ? chat.user2 : chat.user1;
}

function initials(name: string) {
  return (name || 'U').charAt(0).toUpperCase();
}

function formatTime(ts: Timestamp | null) {
  if (!ts) return '';
  return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: Timestamp | null) {
  if (!ts) return '';
  const d = ts.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function sameDay(a: Timestamp | null, b: Timestamp | null) {
  if (!a || !b) return false;
  return a.toDate().toDateString() === b.toDate().toDateString();
}

async function sendPushNotification(recipientId: string, message: string, chatId: string) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        recipientId,
        title: 'Marhabten Support',
        body: message,
        data: { chatId, senderId: SUPPORT_UID, senderName: 'Marhabten Support' },
      }),
    });
  } catch { /* silently ignore */ }
}

export default function ConversationsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time chat list
  useEffect(() => {
    const q = query(collection(db, 'Chats'), where('users', 'array-contains', SUPPORT_UID));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
      list.sort((a, b) => (b.DateTime?.toMillis() ?? 0) - (a.DateTime?.toMillis() ?? 0));
      setChats(list);
      setLoadingChats(false);
    });
    return () => unsub();
  }, []);

  // Real-time messages
  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, 'Chats', selectedChat.id, 'messages'),
      orderBy('time', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data() as Message));
    });
    return () => unsub();
  }, [selectedChat?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || !selectedChat || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      await addDoc(collection(db, 'Chats', selectedChat.id, 'messages'), {
        message: text,
        sendby: SUPPORT_UID,
        time: Timestamp.now(),
        type: 'text',
        'arabic word': '',
      });
      await setDoc(doc(db, 'Chats', selectedChat.id), { lastMessage: text, DateTime: Timestamp.now() }, { merge: true });
      const partner = getPartner(selectedChat);
      await sendPushNotification(partner.uid, text, selectedChat.id);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `chat_images/${selectedChat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'Chats', selectedChat.id, 'messages'), {
        message: url,
        sendby: SUPPORT_UID,
        time: Timestamp.now(),
        type: 'image',
        'arabic word': '',
      });
      await setDoc(doc(db, 'Chats', selectedChat.id), { lastMessage: '📷 Photo', DateTime: Timestamp.now() }, { merge: true });
      const partner = getPartner(selectedChat);
      await sendPushNotification(partner.uid, '📷 Photo', selectedChat.id);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openNewChatModal = async () => {
    setShowNewChat(true);
    setLoadingUsers(true);
    const snap = await getDocs(collection(db, 'users'));
    setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoadingUsers(false);
  };

  const startConversation = async (user: FirestoreUser) => {
    const chatId = `${user.id}_support`;
    const userName = (user['1_name'] as string) || (user['name'] as string) || 'User';
    await setDoc(doc(db, 'Chats', chatId), {
      user1: { uid: user.id, name: userName, image: '', badges: 0 },
      user2: { uid: SUPPORT_UID, name: 'Marhabten Support', image: '', badges: 0 },
      lastMessage: '', DateTime: Timestamp.now(),
      users: [user.id, SUPPORT_UID], messages: [],
    }, { merge: true });
    setSelectedChat({
      id: chatId,
      user1: { uid: user.id as string, name: userName, image: '', badges: 0 },
      user2: { uid: SUPPORT_UID, name: 'Marhabten Support', image: '', badges: 0 },
      lastMessage: '', DateTime: null, users: [user.id as string, SUPPORT_UID],
    });
    setShowNewChat(false);
    setUserSearch('');
  };

  const filteredUsers = allUsers
    .filter((u) => {
      const name = ((u['1_name'] as string) || (u['name'] as string) || '').toLowerCase();
      const phone = ((u['3_phoneNumber'] as string) || '').toLowerCase();
      const email = ((u['2_email'] as string) || (u['email'] as string) || '').toLowerCase();
      const q = userSearch.toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    })
    .filter((u) => u.id !== SUPPORT_UID);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBack = () => setSelectedChat(null);

  // On mobile: show list when no chat selected, show conversation when selected.
  // On desktop (md+): always show both panels side by side.
  const showList = !selectedChat;   // mobile only logic (desktop always shows list via md:flex)
  const showConvo = !!selectedChat; // mobile only logic

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-gray-50">

      {/* ── Left: chat list ── */}
      <div
        className={`
          flex-col bg-white border-r border-gray-100
          w-full md:w-72 md:flex-shrink-0
          ${showList ? 'flex' : 'hidden'}
          md:flex
        `}
      >
        <div className="pl-16 pr-5 lg:pl-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Support Chats</h2>
          <button
            onClick={openNewChatModal}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {loadingChats ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 p-6">
            <MessageSquare size={32} />
            <p className="text-sm text-center">No conversations yet</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto py-2">
            {chats.map((chat) => {
              const partner = getPartner(chat);
              const active = selectedChat?.id === chat.id;
              return (
                <li key={chat.id}>
                  <button
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition rounded-xl mx-1 ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {initials(partner.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{partner.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {chat.lastMessage === '📷 Photo'
                          ? <span className="flex items-center gap-1"><ImageIcon size={10} /> Photo</span>
                          : (chat.lastMessage || 'No messages yet')}
                      </p>
                    </div>
                    {chat.DateTime && (
                      <span className="text-xs text-gray-300 flex-shrink-0">{formatTime(chat.DateTime)}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Right: conversation ── */}
      <div
        className={`
          flex-col min-w-0
          ${showConvo ? 'flex' : 'hidden'}
          md:flex flex-1
        `}
      >
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="pl-16 pr-4 lg:pl-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
              {/* Back button — visible on mobile only */}
              <button
                onClick={handleBack}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition flex-shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                {initials(getPartner(selectedChat).name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{getPartner(selectedChat).name || 'User'}</p>
                <p className="text-xs text-gray-400">Support conversation</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.length === 0 && (
                <p className="text-center text-gray-300 text-sm mt-12">No messages yet. Say hello!</p>
              )}
              {messages.map((msg, i) => {
                const isSupport = msg.sendby === SUPPORT_UID;
                const prev = i > 0 ? messages[i - 1] : null;
                const showDate = !prev || !sameDay(prev.time, msg.time);
                return (
                  <div key={i}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(msg.time)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isSupport ? 'justify-end' : 'justify-start'} mb-1`}>
                      {msg.type === 'image' ? (
                        <div
                          className={`max-w-[75vw] md:max-w-xs cursor-pointer rounded-2xl overflow-hidden shadow-sm ${isSupport ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          onClick={() => setLightboxUrl(msg.message)}
                        >
                          <img
                            src={msg.message}
                            alt="Sent image"
                            className="block max-h-64 object-cover w-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className={`px-2 py-1 text-right text-xs ${isSupport ? 'bg-blue-600 text-blue-200' : 'bg-white text-gray-400'}`}>
                            {formatTime(msg.time)}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[75vw] md:max-w-md px-4 py-2.5 text-sm break-words ${
                            isSupport
                              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 text-right ${isSupport ? 'text-blue-200' : 'text-gray-400'}`}>
                            {formatTime(msg.time)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Upload progress */}
            {uploadingImage && (
              <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-400">Uploading image…</span>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-end gap-2 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-40"
                title="Send image"
              >
                <Paperclip size={16} />
              </button>

              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent leading-relaxed"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />

              {sending ? (
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                </div>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Desktop empty state — only visible on md+ when no chat selected */
          <div className="flex-1 hidden md:flex items-center justify-center text-gray-300">
            <div className="text-center space-y-3">
              <MessageSquare size={48} className="mx-auto" />
              <p className="text-sm">Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* ── New conversation modal ── */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Start a Conversation</h3>
              <button
                onClick={() => { setShowNewChat(false); setUserSearch(''); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, phone or email…"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No users found</p>
              ) : (
                filteredUsers.slice(0, 30).map((user) => {
                  const name = (user['1_name'] as string) || (user['name'] as string) || 'Unknown';
                  const sub = (user['3_phoneNumber'] as string) || (user['2_email'] as string) || (user['email'] as string) || '';
                  return (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 flex items-center gap-3 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Image lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
