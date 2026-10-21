
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

function Inbox({ onBack, onOpenChat }) {
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
      async (snapshot) => {
        try {
          const nextConversations = await Promise.all(
            snapshot.docs.map(async (conversationDoc) => {
              const conversation = {
                id: conversationDoc.id,
                ...conversationDoc.data(),
              };
              const otherUserId = conversation.participantIds?.find(
                (id) => id !== user.uid
              );
              const isBuyer = user.uid === conversation.buyerId;
              const savedName = isBuyer
                ? conversation.sellerName
                : conversation.buyerName;

              if (savedName || !otherUserId) {
                return {
                  ...conversation,
                  otherUserName: savedName || (isBuyer ? "Seller" : "Buyer"),
                  otherUserId,
                };
              }

              const profileSnapshot = await getDoc(
                doc(db, "profiles", otherUserId)
              );
              const profile = profileSnapshot.exists()
                ? profileSnapshot.data()
                : null;
              const profileName =
                profile?.profileType === "business"
                  ? profile.businessName
                  : profile?.displayName;

              return {
                ...conversation,
                otherUserName: profileName || (isBuyer ? "Seller" : "Buyer"),
                otherUserId,
              };
            })
          );

          setConversations(
            nextConversations.sort(
              (a, b) =>
                (b.updatedAt?.toMillis?.() ?? 0) -
                (a.updatedAt?.toMillis?.() ?? 0)
            )
          );
          setLoading(false);
          setError("");
        } catch (err) {
          console.error("Could not load participant names:", err);
          setError(`Could not load conversation details: ${err.message}`);
          setLoading(false);
        }
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
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
        <section className="mx-auto max-w-3xl animate-pulse">
          <div className="h-10 w-40 rounded-xl bg-gray-200" />
          <div className="mt-6 h-8 w-56 rounded bg-gray-200" />
          <div className="mt-5 space-y-3">
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
          </div>
          <p className="mt-5 text-center text-sm text-gray-500">
            Loading your messages...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <span aria-hidden="true">←</span> Back to marketplace
        </button>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Your inbox
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
            Messages
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Keep track of conversations about marketplace listings.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!error && conversations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              💬
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              No conversations yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Browse the marketplace and message a seller when you find
              something you like. Your conversations will appear here.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Explore listings
            </button>
          </div>
        )}

        <div className="space-y-3">
          {conversations.map((conversation) => {
            const user = auth.currentUser;

            const otherUserId =
              conversation.participantIds?.find((id) => id !== user?.uid);

            const otherUserName = conversation.otherUserName;

            return (
              <article
                key={conversation.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800">
                    {(otherUserName || "S").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Chat with {otherUserName}
                    </p>
                    <h2 className="mt-1 truncate font-bold text-gray-900">
                      {conversation.listingTitle || "Marketplace listing"}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenChat({
                      conversationId: conversation.id,
                      otherUserId,
                      otherUserName,
                    })
                  }
                  className="w-full shrink-0 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:w-auto"
                >
                  Open conversation
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Inbox;
