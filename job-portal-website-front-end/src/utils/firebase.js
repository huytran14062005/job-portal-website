import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import {
  getDatabase,
  ref,
  push,
  off,
  query,
  orderByChild,
  set,
  onValue,
  get,
} from "firebase/database";
import { authApis, endpoints } from "../configs/Apis";



const firebaseConfig = {
  apiKey: "AIzaSyDHYIphOs0AJN9ic1e6CTXpVMus5OAyGiQ",
  authDomain: "job-searching-2e6f2.firebaseapp.com",
  databaseURL: "https://job-searching-2e6f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "job-searching-2e6f2",
  storageBucket: "job-searching-2e6f2.firebasestorage.app",
  messagingSenderId: "1096889618829",
  appId: "1:1096889618829:web:77f394a02e30be6657edc4"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);


export const generateRoomId = (recruiterId, candidateId) => {
  return `recruiter_${recruiterId}_candidate_${candidateId}`;
};


export const signInFirebase = async (customToken) => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);

    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    console.error("[Firebase] Sign in error:", error);
    console.error("[Firebase] Error code:", error.code);
    console.error("[Firebase] Error message:", error.message);
    return { success: false, error: error.message };
  }
};


let firebaseAuthPromise = null;


export const ensureFirebaseAuth = async () => {
  if (auth.currentUser) {
    return { success: true, uid: auth.currentUser.uid };
  }

  if (!firebaseAuthPromise) {
    firebaseAuthPromise = (async () => {
      try {
        const res = await authApis().get(endpoints["firebase-token"]);
        const token = res.data?.firebase_token;
        if (!token) {
          return { success: false, error: "Không lấy được Firebase token" };
        }
        return await signInFirebase(token);
      } catch (error) {
        console.error("[Firebase] ensureFirebaseAuth error:", error);
        return { success: false, error: error.message };
      }
    })();

    
    firebaseAuthPromise = firebaseAuthPromise.then((result) => {
      if (!result.success) {
        firebaseAuthPromise = null;
      }
      return result;
    });
  }

  return firebaseAuthPromise;
};


export const sendMessage = async (
  recruiterId,
  candidateId,
  senderId,
  senderName,
  senderRole,
  text,
) => {
  try {
    const roomId = generateRoomId(recruiterId, candidateId);
    const messagesRef = ref(database, `job_chats/${roomId}/messages`);
    await push(messagesRef, {
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole, 
      text: text,
      timestamp: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Send message error:", error);
    return { success: false, error: error.message };
  }
};


export const listenToMessages = (recruiterId, candidateId, callback) => {
  try {
    const roomId = generateRoomId(recruiterId, candidateId);

    const messagesRef = ref(database, `job_chats/${roomId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild("timestamp"));

    onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((child) => {
        messages.push({
          id: child.key,
          ...child.val(),
        });
      });
      callback(messages);
    }, (error) => {
      console.error("[Firebase] Listen error:", error);
      callback([]);
    });

    return messagesRef;
  } catch (error) {
    console.error("[Firebase] listenToMessages error:", error);
    callback([]);
    return null;
  }
};


export const stopListeningToMessages = (messagesRef) => {
  off(messagesRef);
};


export const saveRecruiterChatMetadata = async (
  recruiterId,
  candidateId,
  candidateName,
  candidateAvatar,
  lastMessage,
  incrementUnread = true,
  isRecruiterSending = false,
) => {
  try {
    const metadataRef = ref(
      database,
      `recruiter_chats/${recruiterId}/candidates/${candidateId}`,
    );

    const snapshot = await get(metadataRef);
    const currentData = snapshot.val() || {};

    const updates = {
      candidateId: candidateId,
      candidateName: candidateName,
      candidateAvatar: candidateAvatar || "",
      lastMessage: lastMessage,
      lastMessageTime: Date.now(),
    };

    
    
    if (isRecruiterSending) {
      const currentCandidateUnread = currentData.candidateUnreadCount || 0;
      updates.candidateUnreadCount = incrementUnread
        ? currentCandidateUnread + 1
        : 0;
      updates.unreadCount = currentData.unreadCount || 0;
    } else {
      const currentUnread = currentData.unreadCount || 0;
      updates.unreadCount = incrementUnread ? currentUnread + 1 : 0;
      updates.candidateUnreadCount = currentData.candidateUnreadCount || 0;
    }

    await set(metadataRef, updates);
    return { success: true };
  } catch (error) {
    console.error("Save recruiter chat metadata error:", error);
    return { success: false, error: error.message };
  }
};


export const saveCandidateChatMetadata = async (
  candidateId,
  recruiterId,
  recruiterName,
  companyName,
  companyLogo,
  lastMessage,
  incrementUnread = false,
) => {
  try {
    const metadataRef = ref(
      database,
      `candidate_chats/${candidateId}/recruiters/${recruiterId}`,
    );

    const snapshot = await get(metadataRef);
    const currentData = snapshot.val() || {};

    let newUnreadCount = 0;
    if (incrementUnread) {
      const currentUnread = currentData.candidateUnreadCount || 0;
      newUnreadCount = currentUnread + 1;
    }

    await set(metadataRef, {
      recruiterId: recruiterId,
      recruiterName: recruiterName,
      companyName: companyName,
      companyLogo: companyLogo || "",
      lastMessage: lastMessage,
      lastMessageTime: Date.now(),
      candidateUnreadCount: newUnreadCount,
    });
    return { success: true };
  } catch (error) {
    console.error("Save candidate chat metadata error:", error);
    return { success: false, error: error.message };
  }
};


export const getRecruiterChatList = (recruiterId, callback) => {
  const chatListRef = ref(database, `recruiter_chats/${recruiterId}/candidates`);

  onValue(
    chatListRef,
    (snapshot) => {
      const chatList = [];
      snapshot.forEach((child) => {
        chatList.push({
          id: child.key,
          ...child.val(),
        });
      });
      chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      callback(chatList);
    },
    (error) => {
      console.error("[Firebase] getRecruiterChatList error:", error);
      callback([]);
    },
  );

  return chatListRef;
};


export const resetRecruiterUnreadCount = async (recruiterId, candidateId) => {
  try {
    const metadataRef = ref(
      database,
      `recruiter_chats/${recruiterId}/candidates/${candidateId}`,
    );

    
    const snapshot = await get(metadataRef);
    if (!snapshot.exists()) {
      return { success: true };
    }

    await set(
      ref(
        database,
        `recruiter_chats/${recruiterId}/candidates/${candidateId}/unreadCount`,
      ),
      0,
    );
    return { success: true };
  } catch (error) {
    console.error("Reset recruiter unread error:", error);
    return { success: false, error: error.message };
  }
};


export const resetCandidateUnreadCount = async (candidateId, recruiterId) => {
  try {
    const metadataRef = ref(
      database,
      `candidate_chats/${candidateId}/recruiters/${recruiterId}`,
    );

    
    const snapshot = await get(metadataRef);
    if (!snapshot.exists()) {
      return { success: true };
    }

    await set(
      ref(
        database,
        `candidate_chats/${candidateId}/recruiters/${recruiterId}/candidateUnreadCount`,
      ),
      0,
    );
    return { success: true };
  } catch (error) {
    console.error("Reset candidate unread error:", error);
    return { success: false, error: error.message };
  }
};


export const listenToCandidateUnreadWithRecruiter = (
  candidateId,
  recruiterId,
  callback,
) => {
  const unreadRef = ref(
    database,
    `candidate_chats/${candidateId}/recruiters/${recruiterId}/candidateUnreadCount`,
  );

  onValue(
    unreadRef,
    (snapshot) => {
      callback(snapshot.val() || 0);
    },
    (error) => {
      console.error(
        "[Firebase] listenToCandidateUnreadWithRecruiter error:",
        error,
      );
      callback(0);
    },
  );

  return unreadRef;
};
