
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { startConversation } from "./chatService";

function ListingDetails({ listingId, user, onBack, onViewSeller }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatError, setChatError] = useState("");
  const [startingChat, setStartingChat] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setError("Listing not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSelectedImage(0);

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
          setListing(null);
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
    return <p className="p-6 text-gray-600">Loading listing details...</p>;
  }

  if (error || !listing) {
    return (
      <section className="mx-auto max-w-4xl p-6">
        <p className="mb-4 text-red-600">
          {error || "Listing not found."}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white"
        >
          Back to listings
        </button>
      </section>
    );
  }

  const images = Array.isArray(listing.imageUrls)
    ? listing.imageUrls.filter(Boolean)
    : [];

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

  async function handleMessageSeller() {
    if (!user) {
      navigate("/login", {
        state: { returnListingId: listing.id },
      });
      return;
    }

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

  const whatsappLink = getWhatsAppLink();

  return (
    <section className="mx-auto my-6 max-w-5xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
      >
        ← Back to listings
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {images.length > 0 ? (
            <>
              <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:h-96">
                <img
                  src={images[selectedImage]}
                  alt={`${listing.title} photo ${selectedImage + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {images.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      aria-label={`View photo ${index + 1}`}
                      aria-pressed={selectedImage === index}
                      className={`overflow-hidden rounded-xl border-2 bg-gray-50 ${
                        selectedImage === index
                          ? "border-emerald-600"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${listing.title} thumbnail ${index + 1}`}
                        className="h-24 w-full object-cover sm:h-28"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              No photos available
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {listing.category || "Marketplace listing"}
          </p>

          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {listing.title}
          </h1>

          <p className="mt-4 text-3xl font-extrabold text-emerald-700">
            KSh {Number(listing.price).toLocaleString("en-KE")}
          </p>

          <div className="my-6 border-t border-gray-200" />

          <h2 className="mb-2 text-lg font-bold text-gray-900">
            Description
          </h2>
          <p className="whitespace-pre-wrap leading-7 text-gray-600">
            {listing.description || "No description provided."}
          </p>

          <div className="mt-6 space-y-3 text-sm text-gray-700">
            <p>
              <strong>Location:</strong> {listing.location || "Not specified"}
            </p>
            <p>
              <strong>Seller:</strong>{" "}
              {listing.sellerName || "Gataka Connect Seller"}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3">
            {listing.sellerId && (
              <>
                <button
                  type="button"
                  onClick={() => onViewSeller(listing.sellerId)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50"
                >
                  View Seller Profile
                </button>

                <button
                  type="button"
                  onClick={handleMessageSeller}
                  disabled={startingChat}
                  className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startingChat
                    ? "Opening chat..."
                    : user
                      ? "Message Seller"
                      : "Sign in or register to message seller"}
                </button>
              </>
            )}

            {chatError && (
              <p role="alert" className="text-sm text-red-600">
                {chatError}
              </p>
            )}

            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-xl border border-green-600 px-4 py-3 text-center font-bold text-green-700 hover:bg-green-50"
              >
                Contact Seller on WhatsApp
              </a>
            ) : (
              <p className="text-sm text-gray-500">
                Seller WhatsApp number unavailable.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ListingDetails;
