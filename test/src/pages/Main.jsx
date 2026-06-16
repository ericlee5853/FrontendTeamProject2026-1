// src/pages/Main.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, getDocs, getDoc, arrayUnion 
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import ListPanel from "../components/ListPanel";
import ChatWindow from "../components/ChatWindow";

export default function Main() {
  const { user } = useAuth();
  const [myInfo, setMyInfo] = useState(null);

  const [activeTab, setActiveTab] = useState("chat"); 
  const [searchEmail, setSearchEmail] = useState(""); 
  const [friends, setFriends] = useState([]); 
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [rooms, setRooms] = useState([]); 
  
  const [selectedRoomId, setSelectedRoomId] = useState(null); 
  const [currentRoomName, setCurrentRoomName] = useState(""); 
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState(""); 

  // 내 프로필 정보(이름) 가져오기
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) setMyInfo(d.data());
    });
  }, [user]);

  // 친구 요청 및 수락 목록 감시
  useEffect(() => {
    if (!user) return;

    const qPending = query(collection(db, "friendRequests"), where("receiverId", "==", user.uid), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qFriends1 = query(collection(db, "friendRequests"), where("senderId", "==", user.uid), where("status", "==", "accepted"));
    const unsubFriends1 = onSnapshot(qFriends1, async (snapshot) => {
      const list1 = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const userDoc = await getDoc(doc(db, "users", data.receiverId));
        return { uid: data.receiverId, name: userDoc.exists() ? userDoc.data().name : "사용자" };
      }));
      
      const qFriends2 = query(collection(db, "friendRequests"), where("receiverId", "==", user.uid), where("status", "==", "accepted"));
      getDocs(qFriends2).then(async (snap2) => {
        const list2 = await Promise.all(snap2.docs.map(async (d) => {
          const data = d.data();
          const userDoc = await getDoc(doc(db, "users", data.senderId));
          return { uid: data.senderId, name: userDoc.exists() ? userDoc.data().name : "사용자" };
        }));
        setFriends([...list1, ...list2]);
      });
    });

    return () => {
      unsubPending();
      unsubFriends1();
    };
  }, [user]);

  // [유동적 로직 수정을 적용] 다중 참여자 이름을 연동하여 방 목록 로드
  useEffect(() => {
    if (!user) return;

    const qRooms = query(collection(db, "rooms"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    const unsubRooms = onSnapshot(qRooms, async (snapshot) => {
      const roomList = await Promise.all(snapshot.docs.map(async (roomDoc) => {
        const roomData = roomDoc.data();
        
        // 나를 제외한 참여자들의 UID 배열 파싱
        const opponentIds = roomData.participants.filter(id => id !== user.uid);
        
        let displayNames = [];
        if (opponentIds.length === 0) {
          displayNames.push("참여자 없음 (나 혼자 방)");
        } else {
          for (const id of opponentIds) {
            const userDoc = await getDoc(doc(db, "users", id));
            if (userDoc.exists()) displayNames.push(userDoc.data().name);
          }
        }

        return { 
          id: roomDoc.id, 
          ...roomData, 
          displayName: displayNames.join(", ") // 여러 명의 이름을 쉼표로 연결
        };
      }));
      setRooms(roomList);
    }, (err) => console.error(err));

    return () => unsubRooms();
  }, [user]);

  // 대화 메시지 실시간 수신
  useEffect(() => {
    if (!selectedRoomId) return;
    const qMessages = query(collection(db, "rooms", selectedRoomId, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));
    return () => unsubMessages();
  }, [selectedRoomId]);

  // [기능 구현] 빈 대화방 최초 개설 함수
  const handleCreateGroupRoom = async () => {
    try {
      const newRoomRef = await addDoc(collection(db, "rooms"), {
        participants: [user.uid], // 최초 생성 시에는 나 혼자 포함됨
        lastMessage: "새로운 대화방이 생성되었습니다. 상대를 초대하십시오.",
        updatedAt: serverTimestamp()
      });
      setSelectedRoomId(newRoomRef.id);
      setCurrentRoomName("참여자 없음 (나 혼자 방)");
      alert("대화방이 개설되었습니다. 우측 상단에서 친구를 초대하십시오.");
    } catch (err) {
      console.error(err);
    }
  };

  // [기능 구현] 대화방에 특정 UID 유저를 초대하여 participants 배열에 집어넣는 함수
  const handleInviteUser = async (friendUid) => {
    if (!selectedRoomId) return;
    try {
      const roomRef = doc(db, "rooms", selectedRoomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const currentParts = roomSnap.data().participants;
        if (currentParts.includes(friendUid)) {
          alert("이미 이 대화방에 참여 중인 친구입니다.");
          return;
        }
      }

      // arrayUnion을 활용하여 중복 없이 배열에 UID 적재
      await updateDoc(roomRef, {
        participants: arrayUnion(friendUid),
        updatedAt: serverTimestamp()
      });
      alert("대화방에 친구를 초대했습니다.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    try {
      const qUser = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const userSnap = await getDocs(qUser);
      if (userSnap.empty) { alert("사용자가 없습니다."); return; }
      const targetUserData = userSnap.docs[0].data();
      if (targetUserData.uid === user.uid) { alert("본인 추가 불가"); return; }
      await addDoc(collection(db, "friendRequests"), { senderId: user.uid, receiverId: targetUserData.uid, status: "pending", createdAt: serverTimestamp() });
      alert("요청 완료");
      setSearchEmail("");
    } catch (err) { console.error(err); }
  };

  const handleAcceptFriend = async (requestId) => {
    try { await updateDoc(doc(db, "friendRequests", requestId), { status: "accepted" }); alert("수락 완료"); } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoomId) return;
    try {
      // 메시지 저장 시 발신자 이름(senderName)을 포함하여 렌더링 결함 방지
      await addDoc(collection(db, "rooms", selectedRoomId, "messages"), { 
        text: inputText.trim(), 
        senderId: user.uid, 
        senderName: myInfo?.name || "사용자",
        createdAt: serverTimestamp() 
      });
      await updateDoc(doc(db, "rooms", selectedRoomId), { lastMessage: inputText.trim(), updatedAt: serverTimestamp() });
      setInputText("");
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <ListPanel 
        activeTab={activeTab} searchEmail={searchEmail} setSearchEmail={setSearchEmail} 
        handleSendFriendRequest={handleSendFriendRequest} pendingRequests={pendingRequests} 
        handleAcceptFriend={handleAcceptFriend} friends={friends} handleCreateGroupRoom={handleCreateGroupRoom} 
        rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId} setCurrentRoomName={setCurrentRoomName} 
      />
      <ChatWindow 
        selectedRoomId={selectedRoomId} currentRoomName={currentRoomName} messages={messages} 
        user={user} inputText={inputText} setInputText={setInputText} handleSendMessage={handleSendMessage}
        friends={friends} handleInviteUser={handleInviteUser}
      />
    </div>
  );
}