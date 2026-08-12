import React, { useState, useEffect, useRef, useContext } from "react";
import { authApis, endpoints } from "../configs/Apis";
import * as Firebase from "../utils/firebase";
import { MyUserContext } from "../configs/Contexts";
import { useSocket } from "../contexts/SocketContext";
import {
  getAvatarByRole,
  onApplicantAvatarError,
  onCompanyLogoError,
} from "../utils/defaultImages";
import "../css/ChatModal.css";


const isSameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};


const formatDayLabel = (timestamp) => {
  const now = Date.now();
  if (isSameDay(timestamp, now)) return "Hôm nay";
  if (isSameDay(timestamp, now - 86400000)) return "Hôm qua";
  return new Date(timestamp).toLocaleDateString("vi-VN");
};


const GROUP_WINDOW = 5 * 60 * 1000;

const ChatModal = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  otherUserRole, 
  companyName, 
  companyId, 
}) => {
  const [user] = useContext(MyUserContext);
  const { emitNewMessageSent } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const messagesRef = useRef(null);
  const messagesEndRef = useRef(null);

  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  useEffect(() => {
    return () => {
      if (messagesRef.current) {
        Firebase.stopListeningToMessages(messagesRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    if (!isOpen || !otherUserId || !user) {
      return;
    }

    const initChat = async () => {
      setLoading(true);
      setError(null);

      
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError("Không thể tải tin nhắn. Vui lòng kiểm tra kết nối.");
      }, 10000);

      try {
        
        const profileResponse = await authApis().get(endpoints["current-user"]);
        setCurrentUserProfile(profileResponse.data);

        
        const tokenResponse = await authApis().get(endpoints["firebase-token"]);

        if (tokenResponse.data && tokenResponse.data.firebase_token) {
          
          const signInResult = await Firebase.signInFirebase(
            tokenResponse.data.firebase_token
          );

          if (!signInResult.success) {
            console.error("[ChatModal] Firebase sign in failed:", signInResult.error);
            clearTimeout(timeoutId);
            setError("Không thể kết nối Firebase: " + signInResult.error);
            setLoading(false);
            return;
          }

          
          const recruiterId =
            user.role === "nhatuyendung" ? user.id : otherUserId;
          const candidateId = user.role === "ungvien" ? user.id : otherUserId;

          
          await new Promise(resolve => setTimeout(resolve, 500));

          messagesRef.current = Firebase.listenToMessages(
            recruiterId,
            candidateId,
            (newMessages) => {
              clearTimeout(timeoutId);
              setMessages(newMessages);
              setLoading(false);
            }
          );

          
          if (user.role === "nhatuyendung") {
            await Firebase.resetRecruiterUnreadCount(recruiterId, candidateId);
          } else {
            await Firebase.resetCandidateUnreadCount(candidateId, recruiterId);
          }
          
          
          try {
            
            const notificationsResponse = await authApis().get("/notifications", {
              params: { per_page: 100 }
            });
            
            
            const messageNotifications = notificationsResponse.data.notifications.filter(
              n => n.type === "tin nhắn mới" && 
                   n.related_type === "message" && 
                   n.related_id === otherUserId &&
                   !n.is_read
            );
            
            
            for (const notif of messageNotifications) {
              await authApis().put(`/notifications/${notif.id}/read`);
            }
          } catch (error) {
            console.error("[ChatModal] Error marking notifications as read:", error);
          }
        } else {
          console.error("[ChatModal] No firebase_token in response");
          clearTimeout(timeoutId);
          setError("Không thể lấy Firebase token");
          setLoading(false);
        }
      } catch (err) {
        console.error("[ChatModal] Init chat error:", err);
        console.error("[ChatModal] Error details:", err.message, err.stack);
        clearTimeout(timeoutId);
        setError("Có lỗi xảy ra khi tải tin nhắn: " + err.message);
        setLoading(false);
      }
    };

    initChat();

    
    return () => {
      if (messagesRef.current) {
        Firebase.stopListeningToMessages(messagesRef.current);
      }
    };
  }, [isOpen, otherUserId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUserProfile) return;

    setSending(true);

    try {
      const recruiterId = user.role === "nhatuyendung" ? user.id : otherUserId;
      const candidateId = user.role === "ungvien" ? user.id : otherUserId;

      
      const result = await Firebase.sendMessage(
        recruiterId,
        candidateId,
        user.id,
        user.username,
        user.role,
        newMessage.trim()
      );

      if (result.success) {
        
        if (user.role === "nhatuyendung") {
          
          await Firebase.saveRecruiterChatMetadata(
            recruiterId,
            candidateId,
            otherUserName, 
            otherUserAvatar, 
            newMessage.trim(),
            true, 
            true  
          );

          await Firebase.saveCandidateChatMetadata(
            candidateId,
            recruiterId,
            currentUserProfile.full_name || user.username, 
            companyName || currentUserProfile.company_name || "",
            currentUserProfile.logo_url || "", 
            newMessage.trim(),
            true 
          );
        } else {
          
          await Firebase.saveCandidateChatMetadata(
            candidateId,
            recruiterId,
            otherUserName, 
            companyName || "",
            otherUserAvatar, 
            newMessage.trim(),
            false 
          );

          await Firebase.saveRecruiterChatMetadata(
            recruiterId,
            candidateId,
            currentUserProfile.full_name || user.username, 
            currentUserProfile.avatar_url || "", 
            newMessage.trim(),
            true, 
            false 
          );
        }

        
        try {
          emitNewMessageSent(
            otherUserId,
            currentUserProfile?.full_name || user.username,
            user.role,
            companyName || currentUserProfile?.company_name || "",
            newMessage.trim(),
            companyId
          );
        } catch (socketError) {
          console.error("[ChatModal] Error emitting socket event:", socketError);
          
        }

        setNewMessage("");
      } else {
        alert("Không thể gửi tin nhắn: " + result.error);
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert("Có lỗi xảy ra khi gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="chat-modal-header">
          <div className="chat-header-info">
            <img
              src={getAvatarByRole(otherUserAvatar, otherUserRole)}
              alt={otherUserName}
              className="chat-avatar"
              onError={
                otherUserRole === "nhatuyendung"
                  ? onCompanyLogoError
                  : onApplicantAvatarError
              }
            />
            <div className="chat-header-text">
              <h3>{otherUserName}</h3>
              <p className="chat-company">
                {companyName ||
                  (otherUserRole === "ungvien" ? "Ứng viên" : "Nhà tuyển dụng")}
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        
        <div className="chat-messages">
          {loading ? (
            <div className="chat-skeleton">
              <div className="chat-skeleton-bubble received"></div>
              <div className="chat-skeleton-bubble sent"></div>
              <div className="chat-skeleton-bubble received short"></div>
            </div>
          ) : error ? (
            <div className="chat-error">{error}</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h4>Chưa có tin nhắn nào</h4>
              <p>Gửi lời chào để bắt đầu cuộc trò chuyện</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const prev = index > 0 ? messages[index - 1] : null;

              
              const showDay =
                !prev || !isSameDay(prev.timestamp, msg.timestamp);

              
              const grouped =
                !showDay &&
                prev &&
                prev.sender_id === msg.sender_id &&
                msg.timestamp - prev.timestamp < GROUP_WINDOW;

              return (
                <div key={msg.id}>
                  {showDay && (
                    <div className="chat-day">
                      <span>{formatDayLabel(msg.timestamp)}</span>
                    </div>
                  )}

                  <div
                    className={`chat-message ${
                      msg.sender_id === user.id ? "sent" : "received"
                    }${grouped ? " grouped" : ""}`}
                  >
                    <div className="message-content">
                      <p className="message-text">{msg.text}</p>
                      {!grouped && (
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending || loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending || loading}
          >
            {sending ? (
              <div className="spinner-small"></div>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
