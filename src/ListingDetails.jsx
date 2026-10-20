
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { startConversation } from "./chatService";

function ListingDetails({ listingId, onBack, onViewSeller }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
const [chatError, setChatError] = useState("");
const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setError("Listing not found.");
        setLoading(false);
        return;
      }

      try {
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          setListing({
            id: listingSnap.id,
            ...listingSnap.data(),
          });
        } else {
          setError("This listing does not exist.");
        }
      } catch (err) {
        console.error(err);
        setError("Could not load this listing.");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [listingId]);

  if (loading) {
    return <p>Loading listing details...</p>;
  }

  if (error || !listing) {
    return (
      <section>
        <p>{error || "Listing not found."}</p>
        <button onClick={onBack}>Back to listings</button>
      </section>
    );
  }

  function getWhatsAppLink() {
    let phone = (listing.sellerPhone || "").replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "254" + phone.slice(1);
    }

    if (!/^254[17]\d{8}$/.test(phone)) {
      return null;
    }

    const message = `Hi ${listing.sellerName || "there"}! I'm interested in your listing: ${listing.title}. Is it still available?`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  const whatsappLink = getWhatsAppLink();
  async function handleMessageSeller() {
  setStartingChat(true);
  setChatError("");

  try {
    const conversationId = await startConversation(listing);

    navigate(`/chat/${conversationId}`, {
      state: {
        otherUserName: listing.sellerName || "Seller",
      },
    });
  } catch (err) {
    setChatError(err.message || "Could not start the conversation.");
  } finally {
    setStartingChat(false);
  }
}

  return (
    <section
      style={{
        maxWidth: "800px",
        margin: "24px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <button type="button" onClick={onBack}>
        ← Back to listings
      </button>

      <h1>{listing.title}</h1>

      <h2>
        KSh {Number(listing.price).toLocaleString("en-KE")}
      </h2>

      <p>{listing.description}</p>

      <p>
        <strong>Category:</strong> {listing.category}
      </p>

      <p>
        <strong>Location:</strong> {listing.location}
      </p>

      <p>
        <strong>Seller:</strong>{" "}
        {listing.sellerName || "Gataka Connect Seller"}
      </p>

      {listing.sellerId && (
        <button
          type="button"
          onClick={() => onViewSeller(listing.sellerId)}
        >
          View Seller Profile
        </button>
      )}
      {listing.sellerId && (
  <>
    <button
      type="button"
      onClick={handleMessageSeller}
      disabled={startingChat}
    >
      {startingChat ? "Opening chat..." : "Message Seller"}
    </button>

    {chatError && <p role="alert">{chatError}</p>}
  </>
)}

      {whatsappLink ? (
        <p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button type="button">
              Contact Seller on WhatsApp
            </button>
          </a>
        </p>
      ) : (
        <p>Seller WhatsApp number unavailable.</p>
      )}
    </section>
  );
}

export default ListingDetails;
