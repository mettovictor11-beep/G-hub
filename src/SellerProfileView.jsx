
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
        setError(
          `Could not load this seller's profile: ${
            err.message || "An unexpected Firestore error occurred."
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
        <div className="animate-pulse rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="h-7 w-56 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-40 rounded bg-gray-100" />
          <div className="mt-8 h-20 rounded-xl bg-gray-100" />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Loading seller profile...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          ← Back to listings
        </button>
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800"
        >
          {error}
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          ← Back to listings
        </button>
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            👤
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Seller profile not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This seller has not created a profile yet.
          </p>
        </div>
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
  const sellerInitial = (sellerName || "G").trim().charAt(0).toUpperCase();

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      >
        <span aria-hidden="true">←</span> Back to listings
      </button>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 sm:h-36" />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-100 text-3xl font-extrabold text-emerald-800 shadow-sm sm:h-24 sm:w-24 sm:text-4xl">
                {sellerInitial}
              </div>
              <div className="min-w-0 pb-1">
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  {profile.profileType === "business"
                    ? "Business seller"
                    : "Personal seller"}
                </span>
                <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  {sellerName || "Gataka Connect Seller"}
                </h1>
              </div>
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:w-auto"
              >
                Contact seller on WhatsApp
              </a>
            )}
          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {profile.location || "Location not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600" aria-hidden="true">
                🛍️
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Active listings
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {listings.length} {listings.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-gray-900">About</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {profile.description ||
                "This seller has not added a description yet."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Shop
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
              Active listings
            </h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600">
            {listings.length}
          </span>
        </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="font-semibold text-gray-800">
            No active listings right now
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Check back later to see what this seller has available.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {listing.imageUrls?.[0] ? (
                  <img
                    src={listing.imageUrls[0]}
                    alt={listing.title || "Seller listing"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No photo available
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                {listing.category && (
                  <span className="mb-2 w-fit max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {listing.category}
                  </span>
                )}
                <h3 className="line-clamp-2 text-lg font-bold leading-6 text-gray-900">
                  {listing.title || "Untitled listing"}
                </h3>
                <p className="mt-2 text-xl font-extrabold text-emerald-700">
                  KSh {Number(listing.price || 0).toLocaleString("en-KE")}
                </p>
                {listing.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                    {listing.description}
                  </p>
                )}
                <p className="mt-3 text-sm text-gray-500">
                  <span aria-hidden="true">📍</span>{" "}
                  {listing.location || "Location not specified"}
                </p>

                {getWhatsAppLink(profile.phone, listing.title) && (
                  <a
                    href={getWhatsAppLink(profile.phone, listing.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block rounded-xl border border-emerald-700 px-4 py-2.5 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    Ask about this item
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

export default SellerProfileView;
