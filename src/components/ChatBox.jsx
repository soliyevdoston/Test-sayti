import React, { useState, useEffect, useRef } from "react";
import { Send, User, Trash2, MessageSquare } from "lucide-react";
import { getChatHistoryApi, sendMessageApi, BASE_URL } from "../api/api";
import { io } from "socket.io-client";

const socket = io(BASE_URL, {
  transports: ["polling", "websocket"],
});

export default function ChatBox({ teacherId, studentId, role }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    fetchHistory();
    
    // Join a room specific to this teacher-student pair
    const roomId = `chat_${teacherId}_${studentId}`;
    socket.emit("join-chat", roomId);

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [teacherId, studentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await getChatHistoryApi(teacherId, studentId);
      setMessages(data);
    } catch (err) {
      console.error("Chat history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      teacherId,
      studentId,
      sender: role,
      text: newMessage,
    };

    try {
      const { data } = await sendMessageApi(messageData);
      socket.emit("send-message", {
        roomId: `chat_${teacherId}_${studentId}`,
        message: data
      });
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary/30 rounded-[2rem] border border-primary overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-primary bg-primary/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <MessageSquare size={16} />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Chat</h4>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div 
              key={msg._id || idx} 
              className={`flex ${msg.sender === role ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-bold ${
                msg.sender === role 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-primary border border-primary text-primary rounded-tl-none'
              }`}>
                {msg.text}
                <div className={`text-[8px] mt-1 opacity-50 ${msg.sender === role ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <MessageSquare size={32} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">Xabarlar yo'q</p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-primary/20 border-t border-primary flex gap-2">
        <input 
          placeholder="Xabar yozing..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-primary border border-primary rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-xs font-bold"
        />
        <button className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-indigo-600/20">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
