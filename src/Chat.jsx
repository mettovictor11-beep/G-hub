
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

function Chat({ conversationId, otherUserName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!conversationId) {
      setError("Conversation not found.");
      setLoading(false);
      return;
    }

    const messagesQuery = query(
      collection(
        db,
        "conversations",
        conversationId,
        "messages"
      ),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((messageDoc) => ({
            id: messageDoc.id,
            ...messageDoc.data(),
          }))
        );
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(err);
        setError("Could not load messages.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [conversationId]);

  async function handleSend(e) {
    e.preventDefault();

    const user = auth.currentUser;
    const text = newMessage.trim();

    if (!user || !conversationId || !text || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await addDoc(
        collection(
          db,
          "conversations",
          conversationId,
          "messages"
        ),
        {
          text,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        }
      );

      setNewMessage("");
    } catch (err) {
      console.error(err);
      setError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ maxWidth: "700px", margin: "24px auto" }}>
      <button type="button" onClick={onBack}>
        ← Back
      </button>

      <h2>Chat with {otherUserName || "seller"}</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          minHeight: "250px",
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "16px",
        }}
      >
        {loading && <p>Loading messages...</p>}

        {!loading && messages.length === 0 && (
          <p>No messages yet. Start the conversation!</p>
        )}

        {messages.map((message) => {
          const isMine =
            message.senderId === auth.currentUser?.uid;

          return (
            <div
              key={message.id}
              style={{
                textAlign: isMine ? "right" : "left",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: isMine ? "#dbeafe" : "#f1f5f9",
                  maxWidth: "80%",
                  overflowWrap: "anywhere",
                }}
              >
                {message.text}
              </span>
            </div>
          );
        })}
      </div>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          required
          style={{ flex: 1, padding: "12px" }}
        />

        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}

export default Chat;
