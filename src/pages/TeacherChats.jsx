import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getChatListApi, getChatHistoryApi, sendMessageApi } from "../api/api";
import { toast } from "react-toastify";
import { MessageSquare, Send, User, Search, Hash } from "lucide-react";
import { io } from "socket.io-client";

const BASE_URL = "https://online-test-backend-2.onrender.com"; // Consider importing from a config

const TeacherChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const teacherId = localStorage.getItem("teacherId");
  const teacherName = localStorage.getItem("fullName");
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    socketRef.current = io(BASE_URL);
    
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.student._id);
      const roomId = `${teacherId}-${selectedChat.student._id}`;
      socketRef.current.emit("join-chat", roomId);
    }
  }, [selectedChat]);

  useEffect(() => {
    socketRef.current.on("receive-message", (msg) => {
      if (selectedChat && (msg.senderId === selectedChat.student._id || msg.studentId === selectedChat.student._id)) {
        setMessages((prev) => [...prev, msg]);
      }
      loadChats(); // Refresh list to show new message preview
    });

    return () => socketRef.current.off("receive-message");
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    try {
      const res = await getChatListApi(teacherId);
      setChats(res.data);
    } catch (err) {
      toast.error("Chatlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (studentId) => {
    try {
      const res = await getChatHistoryApi(teacherId, studentId);
      setMessages(res.data);
    } catch (err) {
      toast.error("Xabarlarni yuklashda xatolik");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const msgData = {
      teacherId,
      studentId: selectedChat.student._id,
      senderId: teacherId,
      senderName: teacherName,
      text: newMessage,
      createdAt: new Date(),
    };

    try {
      await sendMessageApi(msgData);
      socketRef.current.emit("send-message", {
        roomId: `${teacherId}-${selectedChat.student._id}`,
        message: msgData,
      });
      setMessages((prev) => [...prev, msgData]);
      setNewMessage("");
      loadChats();
    } catch (err) {
      toast.error("Xabar yuborishda xatolik");
    }
  };

  const filteredChats = chats.filter(c => 
    c.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.student.groupId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <main className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col p-4 md:p-6">
        <div className="bg-primary/50 backdrop-blur-xl border border-primary rounded-[2.5rem] flex-1 flex overflow-hidden shadow-2xl">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-r border-primary flex flex-col bg-secondary/20">
            <div className="p-6 border-b border-primary">
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                <MessageSquare className="text-indigo-500" /> Chatlar
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  placeholder="Qidirish..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-primary text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted text-xs font-bold uppercase tracking-widest">Yuklanmoqda...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs font-bold uppercase tracking-widest opacity-50">Chatlar topilmadi</div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.student._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${selectedChat?.student._id === chat.student._id ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary/40 border-primary hover:bg-secondary'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedChat?.student._id === chat.student._id ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                      <User className={selectedChat?.student._id === chat.student._id ? 'text-white' : 'text-indigo-500'} size={24} />
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4 className={`font-black text-sm truncate ${selectedChat?.student._id === chat.student._id ? 'text-white' : 'text-primary'}`}>
                        {chat.student.fullName}
                      </h4>
                      <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 truncate ${selectedChat?.student._id === chat.student._id ? 'text-white' : 'text-muted'}`}>
                        {chat.student.groupId?.name || "Guruhsiz"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-primary/30">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-primary flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <User className="text-indigo-500" size={20} />
                     </div>
                     <div>
                        <h3 className="font-black text-primary text-sm uppercase">{selectedChat.student.fullName}</h3>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">{selectedChat.student.groupId?.name}</p>
                     </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === teacherId;
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-secondary border border-primary text-primary rounded-tl-none'}`}>
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                          <p className={`text-[8px] mt-2 font-black uppercase tracking-wider opacity-60 ${isMe ? 'text-white text-right' : 'text-muted'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-6 border-t border-primary bg-secondary/30">
                  <div className="flex gap-4">
                    <input 
                      className="flex-1 bg-primary border border-primary p-4 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-muted/50"
                      placeholder="Xabar yozing..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 animate-bounce">
                   <MessageSquare className="text-indigo-500" size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary uppercase italic tracking-tighter mb-2">Xabarni <span className="text-indigo-500">Tanlang</span></h3>
                <p className="text-muted text-xs font-black uppercase tracking-widest max-w-xs leading-loose">Muloqotni boshlash uchun o'ng tarafdagi ro'yxatdan o'quvchini tanlang.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherChats;
