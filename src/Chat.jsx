
import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "./firebase";

function Chat({ conversationId, otherUserName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [readMarkerField, setReadMarkerField] = useState("");
  const latestMessageRef = useRef(null);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return undefined;

    let cancelled = false;

    async function loadReadMarkerField() {
      const user = auth.currentUser;

      if (!user) return;

      try {
        const conversationSnapshot = await getDoc(
          doc(db, "conversations", conversationId)
        );

        if (!conversationSnapshot.exists()) {
          throw new Error("Conversation not found.");
        }

        const conversation = conversationSnapshot.data();
        const field =
          conversation.buyerId === user.uid
            ? "buyerLastReadAt"
            : conversation.sellerId === user.uid
              ? "sellerLastReadAt"
              : null;

        if (!field) {
          throw new Error("You are not a participant in this conversation.");
        }

        if (!cancelled) setReadMarkerField(field);
      } catch (err) {
        if (!cancelled) {
          console.error("Could not prepare message read status:", err);
          setError(`Could not update message read status: ${err.message}`);
        }
      }
    }

    loadReadMarkerField();

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

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !readMarkerField || loading) return;

    updateDoc(doc(db, "conversations", conversationId), {
      [readMarkerField]: serverTimestamp(),
    }).catch((err) => {
      console.error("Could not mark messages as read:", err);
      setError(`Could not update message read status: ${err.message}`);
    });
  }, [conversationId, messages, readMarkerField, loading]);

  if (!conversationId) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
        <section className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p role="alert">Conversation not found.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to conversations
          </button>
        </section>
      </main>
    );
  }

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
      const conversationRef = doc(db, "conversations", conversationId);
      const messageRef = doc(collection(conversationRef, "messages"));
      const batch = writeBatch(db);

      batch.set(messageRef, {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(conversationRef, {
        latestMessageSenderId: user.uid,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      setNewMessage("");
    } catch (err) {
      console.error(err);
      setError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 sm:px-6 sm:py-8">
      <section className="mx-auto flex h-[calc(100vh-2.5rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:h-[calc(100vh-4rem)]">
        <header className="flex items-center gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-lg text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          >
            ←
          </button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
            {(otherUserName || "S").trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900">
              {otherUserName || "Seller"}
            </h1>
            <p className="text-sm text-gray-500">G-hub messages</p>
          </div>
        </header>

        <div
          aria-live="polite"
          className="flex-1 overflow-y-auto bg-gray-50/70 px-4 py-5 sm:px-6"
        >
          {loading && (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading messages...
            </p>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                💬
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">
                Start the conversation
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Send a message to ask about this listing.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message) => {
              const isMine = message.senderId === auth.currentUser?.uid;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                      isMine
                        ? "rounded-br-md bg-emerald-700 text-white"
                        : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              );
            })}
            <div ref={latestMessageRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
          {error && (
            <p
              role="alert"
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3">
            <label htmlFor="chat-message" className="sr-only">
              Type a message to {otherUserName || "the seller"}
            </label>
            <textarea
              id="chat-message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your message..."
              maxLength={2000}
              required
              rows={1}
              className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
            >
              <span>{sending ? "Sending..." : "Send"}</span>
              {!sending && <span aria-hidden="true">↑</span>}
            </button>
          </form>
          <p className="mt-2 px-1 text-xs text-gray-400">
            Messages are limited to 2,000 characters.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Chat;
