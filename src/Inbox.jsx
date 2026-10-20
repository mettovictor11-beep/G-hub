
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

function Inbox({ onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(auth.currentUser));
  const [error, setError] = useState(
    auth.currentUser ? "" : "Please log in to view your messages."
  );

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return undefined;

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        setConversations(
          snapshot.docs
            .map((conversationDoc) => ({
              id: conversationDoc.id,
              ...conversationDoc.data(),
            }))
            .sort(
              (a, b) =>
                (b.updatedAt?.toMillis?.() ?? 0) -
                (a.updatedAt?.toMillis?.() ?? 0)
            )
        );
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Inbox error:", err);
        setError(`Could not load your conversations: ${err.message}`);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return <p>Loading your messages...</p>;
  }

  return (
    <section style={{ maxWidth: "800px", margin: "24px auto" }}>
      <h2>My Messages</h2>

      {error && <p role="alert">{error}</p>}

      {!error && conversations.length === 0 && (
        <p>
          You have no conversations yet. Open a listing and
          select Message Seller to start chatting.
        </p>
      )}

      <div>
        {conversations.map((conversation) => {
          const user = auth.currentUser;

          const otherUserId =
            conversation.participantIds?.find(
              (id) => id !== user?.uid
            );

          const otherUserName =
            user?.uid === conversation.buyerId
              ? "Seller"
              : "Buyer";

          return (
            <article
              key={conversation.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <h3>{conversation.listingTitle || "Marketplace listing"}</h3>

              <p>Chat with: {otherUserName}</p>

              <button
                type="button"
                onClick={() =>
                  onOpenChat({
                    conversationId: conversation.id,
                    otherUserId,
                    otherUserName,
                  })
                }
              >
                Open Conversation
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Inbox;
