import "../css/Content.css";
import FriendTabContent from "../components/FriendTabContent";
import ChatTabContent from "../components/ChatTabContent";

export default function Content(props) {
  if (props.activeTab === "friend") {
    return <FriendTabContent {...props} />;
  }

  return <ChatTabContent {...props} />;
}