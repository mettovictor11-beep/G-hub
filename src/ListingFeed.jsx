import SellerProfileView from "./SellerProfileView";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import ListingDetails from "./ListingDetails";

function ListingFeed({ user })  {
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  

  useEffect(() => {
    const listingsQuery = query(
      collection(db, "listings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      listingsQuery,
      (snapshot) => {
        setListings(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
        setLoading(false);
        setError("");
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const locations = [
    "Gataka",
    "Karen",
    "Rongai",
    "Cooperative University",
    "CUEA",
    "Multimedia University",
    "Tangaza University",
  ];

  
const filteredListings = listings.filter((listing) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    (listing.title || "").toLowerCase().includes(search) ||
    (listing.description || "").toLowerCase().includes(search) ||
    (listing.category || "").toLowerCase().includes(search);

  const matchesCategory =
    categoryFilter === "All" ||
    listing.category === categoryFilter;

  const matchesLocation =
    locationFilter === "All" ||
    listing.location === locationFilter;

  return (
    matchesSearch &&
    matchesCategory &&
    matchesLocation &&
    listing.status === "active"
  );
});

function getWhatsAppLink(listing) {
  let phone = (listing.sellerPhone || "").replace(/\D/g, "");

  // Convert Kenyan numbers to international format.
  if (phone.startsWith("0")) {
    phone = "254" + phone.slice(1);
  } else if (phone.startsWith("254")) {
    // Already in international format.
  } else {
    return null;
  }

  // Kenyan mobile numbers have 12 digits in international format.
  if (!/^254[17]\d{8}$/.test(phone)) {
    return null;
  }

  const message = `Hi ${listing.sellerName || "there"}! I'm interested in your listing: ${listing.title}. Is it still available?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}



  if (loading) {
  return <p>Loading listings...</p>;
}
if (selectedListingId) {
  return (
    <ListingDetails
      listingId={selectedListingId}
      onBack={() => setSelectedListingId(null)}
      onViewSeller={(sellerId) => {
        setSelectedListingId(null);
        setSelectedSellerId(sellerId);
      }}
    />
  );
}

if (selectedSellerId) {
  return (
    <SellerProfileView
      sellerId={selectedSellerId}
      onBack={() => setSelectedSellerId(null)}
    />
  );
}

  return (
    <section>
      <h2>Explore Listings</h2>
      
      
      
<input
  type="search"
  placeholder="Search phones, laptops, salons, houses..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={{
    width: "100%",
    maxWidth: "450px",
    padding: "12px",
    marginBottom: "16px",
  }}
/>


      <div>
        <label htmlFor="category-filter">Category: </label>
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All categories</option>
          <option>Phones & Accessories</option>
          <option>Services & Beauty</option>
          <option>Cars & Motorbikes</option>
          <option>Clothing & Fashion</option>
          <option>Houses & Rentals</option>
          <option>Laptops & Electronics</option>
          <option>Books & Campus Essentials</option>
          <option>Furniture & Home</option>
          <option>Food & Groceries</option>
          <option>Other Items</option>
        </select>

        <label htmlFor="location-filter"> Location: </label>
        <select
          id="location-filter"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="All">All locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {error && <p>Error loading listings: {error}</p>}

      {!error && filteredListings.length === 0 && (
        <p>No listings found. Try another category or location.</p>
      )}

      <div>
        {filteredListings.map((listing) => (
          <article
            key={listing.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px",
            }}
          >
            {listing.imageUrls?.length > 0 && (
              <img
                src={listing.imageUrls[0]}
                alt={listing.title}
                style={{
                  width: "100%",
                  maxHeight: "240px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            )}
            <h3>
  <button
    type="button"
    onClick={() => setSelectedListingId(listing.id)}
    style={{
      border: "none",
      background: "none",
      padding: 0,
      fontSize: "inherit",
      fontWeight: "bold",
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    {listing.title}
  </button>
</h3>
            <p>{listing.description}</p>
            <strong>
              KSh {Number(listing.price).toLocaleString("en-KE")}
            </strong>
            <p>Category: {listing.category}</p>
            <p>Location: {listing.location}</p>
            <p>
             Seller:{" "}
            <button
             type="button"
             onClick={() => setSelectedSellerId(listing.sellerId)}
             disabled={!listing.sellerId}
             style={{
             border: "none",
             background: "none",
              color: "blue",
             textDecoration: "underline",
              cursor: "pointer",
             padding: 0,
    }}
  >
    {listing.sellerName || "View seller"}
  </button>
</p>
            
{user ? (
  getWhatsAppLink(listing) ? (
    <a
      href={getWhatsAppLink(listing)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <button type="button">
        Contact Seller on WhatsApp
      </button>
    </a>
  ) : (
    <p>Seller WhatsApp number unavailable.</p>
  )
) : (
  <button
    type="button"
    onClick={() => {
      window.location.href = "/login";
    }}
  >
    Sign in to Contact Seller
  </button>
)}

          </article>
        ))}
      </div>
    </section>
  );
}

export default ListingFeed;
