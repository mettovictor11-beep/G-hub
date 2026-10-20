
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

function ListingFeed({ user }) {
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

  const categories = [
    "Phones & Accessories",
    "Services & Beauty",
    "Cars & Motorbikes",
    "Clothing & Fashion",
    "Houses & Rentals",
    "Laptops & Electronics",
    "Books & Campus Essentials",
    "Furniture & Home",
    "Food & Groceries",
    "Other Items",
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

    if (phone.startsWith("0")) {
      phone = "254" + phone.slice(1);
    }

    if (!/^254[17]\d{8}$/.test(phone)) {
      return null;
    }

    const message = `Hi ${listing.sellerName || "there"}! I'm interested in your listing: ${listing.title}. Is it still available?`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading listings...
      </div>
    );
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
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Explore the marketplace
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Discover products and services in your community.
        </p>
      </div>

      <div className="mb-7 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
        <div className="mb-4">
          <label
            htmlFor="listing-search"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Search listings
          </label>
          <input
            id="listing-search"
            type="search"
            placeholder="Search phones, laptops, clothes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category-filter"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none focus:border-emerald-600"
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="location-filter"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Location
            </label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none focus:border-emerald-600"
            >
              <option value="All">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {filteredListings.length}{" "}
            {filteredListings.length === 1 ? "listing" : "listings"} found
          </p>

          {(searchTerm || categoryFilter !== "All" || locationFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setLocationFilter("All");
              }}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error loading listings: {error}
        </div>
      )}

      {!error && filteredListings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center">
          <div className="mb-3 text-4xl">🔎</div>
          <h3 className="font-bold text-gray-900">No listings found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try another search term, category, or location.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredListings.map((listing) => {
          const whatsappLink = getWhatsAppLink(listing);

          return (
            <article
              key={listing.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setSelectedListingId(listing.id)}
                className="relative block w-full overflow-hidden bg-gray-100 text-left"
                aria-label={`View ${listing.title}`}
              >
                <div className="aspect-[4/3] w-full">
                  {listing.imageUrls?.length > 0 ? (
                    <img
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No photo available
                    </div>
                  )}
                </div>

                {listing.category && (
                  <span className="absolute left-3 top-3 max-w-[85%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    {listing.category}
                  </span>
                )}
              </button>

              <div className="flex flex-1 flex-col p-4">
                <button
                  type="button"
                  onClick={() => setSelectedListingId(listing.id)}
                  className="line-clamp-2 min-h-12 text-left text-base font-bold leading-6 text-gray-900 hover:text-emerald-700"
                >
                  {listing.title || "Untitled listing"}
                </button>

                <p className="mt-2 text-xl font-extrabold text-emerald-700">
                  KSh {Number(listing.price || 0).toLocaleString("en-KE")}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <span aria-hidden="true">📍</span>
                  <span className="truncate">
                    {listing.location || "Location not specified"}
                  </span>
                </div>

                <div className="mt-2 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">Seller</p>
                  <button
                    type="button"
                    onClick={() => setSelectedSellerId(listing.sellerId)}
                    disabled={!listing.sellerId}
                    className="mt-1 max-w-full truncate text-sm font-semibold text-gray-800 hover:text-emerald-700 disabled:cursor-default"
                  >
                    {listing.sellerName || "Gataka Connect Seller"}
                  </button>
                </div>

                <div className="mt-4">
                  {user ? (
                    whatsappLink ? (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl bg-emerald-700 px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-emerald-800"
                      >
                        Contact on WhatsApp
                      </a>
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
                        WhatsApp number unavailable
                      </p>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedListingId(listing.id)}
                      className="w-full rounded-xl border border-emerald-700 px-3 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      View product
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ListingFeed;
