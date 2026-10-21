
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";

export async function startConversation(listing) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in to message a seller.");
  }

  if (!listing?.id || !listing?.sellerId) {
    throw new Error("This listing is missing seller information.");
  }

  if (user.uid === listing.sellerId) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const participantIds = [user.uid, listing.sellerId].sort();
  const conversationId = `${listing.id}_${participantIds.join("_")}`;

  const conversationRef = doc(
    db,
    "conversations",
    conversationId
  );

  const existingConversation = await getDoc(conversationRef);

  if (!existingConversation.exists()) {
    await setDoc(conversationRef, {
      listingId: listing.id,
      listingTitle: listing.title || "Marketplace listing",
      buyerId: user.uid,
      buyerName: user.displayName || user.email?.split("@")[0] || "Buyer",
      sellerId: listing.sellerId,
      sellerName: listing.sellerName || "Seller",
      participantIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return conversationId;
}
