
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

function SellerProfileView({ sellerId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSeller() {
      if (!sellerId) {
        setError("Seller information is unavailable.");
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "profiles", sellerId);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }

        const listingsQuery = query(
          collection(db, "listings"),
          where("sellerId", "==", sellerId),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );

        const listingsSnap = await getDocs(listingsQuery);

        setListings(
          listingsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Could not load this seller's profile.");
      } finally {
        setLoading(false);
      }
    }

    loadSeller();
  }, [sellerId]);

  if (loading) {
    return <p>Loading seller profile...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>
        <button onClick={onBack}>Back to listings</button>
      </section>
    );
  }

  if (!profile) {
    return (
      <section>
        <h2>Seller profile not found</h2>
        <p>This seller has not created a profile yet.</p>
        <button onClick={onBack}>Back to listings</button>
      </section>
    );
  }

  const sellerName =
    profile.profileType === "business"
      ? profile.businessName
      : profile.displayName;

  function getWhatsAppLink(phone, listingTitle = "") {
    let number = (phone || "").replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "254" + number.slice(1);
    }

    if (!/^254[17]\d{8}$/.test(number)) {
      return null;
    }

    const message = listingTitle
      ? `Hi ${sellerName}! I'm interested in ${listingTitle}. Is it still available?`
      : `Hi ${sellerName}! I found your profile on Gataka Connect.`;

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  const whatsappLink = getWhatsAppLink(profile.phone);

  return (
    <section>
      <button onClick={onBack}>← Back to listings</button>

      <div>
        <h2>{sellerName || "Gataka Connect Seller"}</h2>

        <p>
          {profile.profileType === "business"
            ? "Business Seller"
            : "Personal Seller"}
        </p>

        <p>📍 {profile.location}</p>

        <p>
          {profile.description ||
            "This seller has not added a description yet."}
        </p>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button type="button">Contact Seller on WhatsApp</button>
          </a>
        )}
      </div>

      <h3>Active Listings ({listings.length})</h3>

      {listings.length === 0 ? (
        <p>This seller has no active listings right now.</p>
      ) : (
        <div>
          {listings.map((listing) => (
            <article key={listing.id}>
              <h4>{listing.title}</h4>
              <p>{listing.description}</p>
              <p>
                KSh {Number(listing.price).toLocaleString("en-KE")}
              </p>
              <p>{listing.category}</p>
              <p>📍 {listing.location}</p>

              {getWhatsAppLink(profile.phone, listing.title) && (
                <a
                  href={getWhatsAppLink(profile.phone, listing.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button type="button">Ask about this item</button>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SellerProfileView;
