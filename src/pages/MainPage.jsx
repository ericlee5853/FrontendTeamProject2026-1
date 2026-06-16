import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion,
} from "firebase/firestore";

import Menu from "../windows/Menu";
import List from "../windows/List";
import Content from "../windows/Content";
import Extension from "../windows/Extension";
import "../css/MainPage.css";

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState({ name: "", statusMessage: "", friendCode: "" });

  const [activeTab, setActiveTab] = useState("chat");

  const [searchCode, setSearchCode] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [selectedFriendProfile, setSelectedFriendProfile] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [currentRoomName, setCurrentRoomName] = useState("");

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const [isExtensionOpen, setIsExtensionOpen] = useState(false);

  useEffect(() => {
  if (!user) return;
  console.log("🔍 현재 구독 중인 uid:", user.uid, user.email);  // ← 추가
  const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
    console.log("📄 문서 존재?", snap.exists(), snap.data());     // ← 추가
    if (snap.exists()) {
      const data = snap.data();
      setMyProfile({
        name: data.name || user.email,
        statusMessage: data.statusMessage || "",
        friendCode: data.friendCode || "",
      });
    }
  });
  return () => unsub();
}, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMyProfile({
          name: data.name || user.email,
          statusMessage: data.statusMessage || "",
          friendCode: data.friendCode || "",
        });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "friends"), (snap) => {
      setFriends(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "friendRequests"), where("receiverId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setPendingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === "pending"));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "friendRequests"), where("senderId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setSentRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === "pending"));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "rooms"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "rooms", selectedRoomId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedRoomId]);

  const handleUpdateMyStatus = async (newStatus) => {
    if (!user) return;
    try { await updateDoc(doc(db, "users", user.uid), { statusMessage: newStatus }); } 
    catch (err) { alert("상태 메시지 업데이트 실패: " + err.message); }
  };

  const handleSelectFriendProfile = async (friendUid) => {
    try {
      const snap = await getDoc(doc(db, "users", friendUid));
      if (snap.exists()) { 
        setSelectedFriendProfile({ uid: snap.id, ...snap.data() }); 
      } else {
        setSelectedFriendProfile({ uid: friendUid, name: "알 수 없는 사용자", friendCode: "N/A", statusMessage: "존재하지 않거나 탈퇴한 사용자입니다." });
      }
    } catch (err) { 
      setSelectedFriendProfile({ uid: friendUid, name: "접근 불가", friendCode: "오류", statusMessage: "데이터 오류입니다." });
    }
  };

  const fetchUserProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) return { uid: snap.id, ...snap.data() };
      return null;
    } catch (err) { return null; }
  };

  const handleStartDirectChat = async (targetUid, targetName) => {
    if (!user) return;
    const existingRoom = rooms.find((r) => r.members.length === 2 && r.members.includes(targetUid));

    if (existingRoom) {
      setSelectedRoomId(existingRoom.id);
      setCurrentRoomName(existingRoom.displayName || targetName);
    } else {
      try {
        const docRef = await addDoc(collection(db, "rooms"), {
          displayName: `1:1 대화 (${targetName})`,
          members: [user.uid, targetUid],
          lastMessage: "",
          createdAt: serverTimestamp(),
        });
        setSelectedRoomId(docRef.id);
        setCurrentRoomName(`1:1 대화 (${targetName})`);
      } catch (err) {
        alert("채팅방 생성 실패: " + err.message);
        return;
      }
    }
    setActiveTab("chat");
  };

  // 공용 채팅방 강제 이동
  const handleGoToRoom = (roomId, roomName) => {
    setSelectedRoomId(roomId);
    setCurrentRoomName(roomName);
    setActiveTab("chat");
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    let targetCode = searchCode.trim().toUpperCase();
    if (!targetCode || !user) return;
    if (!targetCode.startsWith("#")) targetCode = `#${targetCode}`;

    try {
      const snap = await getDocs(query(collection(db, "users"), where("friendCode", "==", targetCode)));
      if (snap.empty) { alert("해당 코드의 사용자를 찾을 수 없습니다."); return; }
      const targetUser = { uid: snap.docs[0].id, ...snap.docs[0].data() };
      if (targetUser.uid === user.uid) { alert("자기 자신에게는 요청할 수 없습니다."); return; }
      
      const isAlreadyFriend = friends.some((f) => f.uid === targetUser.uid);
      if (isAlreadyFriend) { alert("이미 친구인 사용자입니다."); return; }

      await addDoc(collection(db, "friendRequests"), {
        senderId: user.uid, senderName: myProfile.name,
        receiverId: targetUser.uid, receiverName: targetUser.name || "이름 없음",
        status: "pending", createdAt: serverTimestamp(),
      });
      alert("친구 요청을 보냈습니다.");
      setSearchCode("");
    } catch (err) { alert("친구 요청 실패: " + err.message); }
  };

  const handleAcceptFriend = async (requestId) => {
    if (!user) return;
    try {
      const reqRef = doc(db, "friendRequests", requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;
      const senderId = reqSnap.data().senderId;
      const senderSnap = await getDoc(doc(db, "users", senderId));
      const senderName = senderSnap.exists() ? senderSnap.data().name : "이름 없음";

      await setDoc(doc(db, "users", user.uid, "friends", senderId), { uid: senderId, name: senderName });
      await setDoc(doc(db, "users", senderId, "friends", user.uid), { uid: user.uid, name: myProfile.name });
      await deleteDoc(reqRef); // 수락 후 요청 문서 삭제
    } catch (err) { alert("친구 수락 실패: " + err.message); }
  };

  const handleCancelFriendRequest = async (requestId) => {
    if (!user) return;
    try { await deleteDoc(doc(db, "friendRequests", requestId)); } 
    catch (err) { alert("요청 취소 실패: " + err.message); }
  };

  const handleRemoveFriend = async (friendUid) => {
    if (!user) return;
    if (!window.confirm("정말 이 친구를 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "friends", friendUid));
      await deleteDoc(doc(db, "users", friendUid, "friends", user.uid));

      if (selectedFriendProfile && selectedFriendProfile.uid === friendUid) {
        setSelectedFriendProfile(null);
      }
      alert("친구가 삭제되었습니다.");
    } catch (err) { alert("친구 삭제 실패: " + err.message); }
  };

  const handleCreateGroupRoom = async () => {
    if (!user) return;
    const roomName = prompt("새 대화방 이름을 입력하세요");
    if (!roomName || !roomName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        displayName: roomName.trim(),
        members: [user.uid],
        lastMessage: "",
        createdAt: serverTimestamp(),
      });
      setSelectedRoomId(docRef.id);
      setCurrentRoomName(roomName.trim());
      setActiveTab("chat");
    } catch (err) { alert("대화방 생성 실패: " + err.message); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedRoomId || !user) return;
    try {
      await addDoc(collection(db, "rooms", selectedRoomId, "messages"), {
        text, senderId: user.uid, senderName: myProfile.name, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "rooms", selectedRoomId), { lastMessage: text });
      setInputText("");
    } catch (err) { alert("메시지 전송 실패: " + err.message); }
  };

  const handleInviteUser = async (friendUid) => {
    if (!selectedRoomId || !friendUid) return;
    try {
      await updateDoc(doc(db, "rooms", selectedRoomId), { members: arrayUnion(friendUid) });
      alert("초대했습니다.");
    } catch (err) { alert("초대 실패: " + err.message); }
  };

  const handleLeaveRoom = async (roomId) => {
    if (!user) return;
    if (!window.confirm("정말 이 채팅방을 나가시겠습니까?")) return;
    
    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const updatedMembers = roomData.members.filter((uid) => uid !== user.uid);
        
        if (updatedMembers.length === 0) { await deleteDoc(roomRef); } 
        else { await updateDoc(roomRef, { members: updatedMembers }); }
        
        if (selectedRoomId === roomId) {
          setSelectedRoomId(null);
          setCurrentRoomName("");
        }
      }
    } catch (err) { alert("나가기 실패: " + err.message); }
  };

  const toggleExtensionSidebar = () => setIsExtensionOpen((prev) => !prev);

  const handleShareToChat = async (text) => {
    if (!selectedRoomId || !user) {
      alert("활성화된 채팅방이 없습니다. 대화창을 먼저 열어주세요.");
      return;
    }
    try {
      await addDoc(collection(db, "rooms", selectedRoomId, "messages"), {
        text, senderId: user.uid, senderName: myProfile.name, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "rooms", selectedRoomId), { lastMessage: text });
    } catch (err) { alert("메시지 전송 실패: " + err.message); }
  };

  if (!user) return <div id="main-page-loading" className="loading-container">로딩 중...</div>;

  return (
    <div id="main-page" className="layout-container">
      <div id="menu-section" className="layout-section">
        <Menu activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div id="list-section" className="layout-section">
        <List
          activeTab={activeTab}
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          setCurrentRoomName={setCurrentRoomName}
          handleCreateGroupRoom={handleCreateGroupRoom}
          searchCode={searchCode}
          setSearchCode={setSearchCode}
          handleSendFriendRequest={handleSendFriendRequest}
          pendingRequests={pendingRequests}
          handleAcceptFriend={handleAcceptFriend}
          sentRequests={sentRequests}
          handleCancelFriendRequest={handleCancelFriendRequest}
        />
      </div>

      <div id="content-section" className="layout-section">
        <Content
          activeTab={activeTab}
          selectedRoomId={selectedRoomId}
          currentRoomName={currentRoomName}
          messages={messages}
          user={user}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          friends={friends}
          handleInviteUser={handleInviteUser}
          isExtensionOpen={isExtensionOpen}
          toggleExtensionSidebar={toggleExtensionSidebar}
          myProfile={myProfile}
          handleUpdateMyStatus={handleUpdateMyStatus}
          selectedFriendProfile={selectedFriendProfile}
          handleSelectFriendProfile={handleSelectFriendProfile}
          handleStartDirectChat={handleStartDirectChat}
          handleGoToRoom={handleGoToRoom}
          rooms={rooms}
          handleLeaveRoom={handleLeaveRoom}
          fetchUserProfile={fetchUserProfile}
          handleRemoveFriend={handleRemoveFriend}
        />
      </div>

      <div id="extension-section" className="layout-section">
        {activeTab === "chat" && isExtensionOpen && <Extension
        onShare={handleShareToChat} 
        user={user}
        userName={myProfile.name}
        />}
        
      </div>
    </div>
  );
}