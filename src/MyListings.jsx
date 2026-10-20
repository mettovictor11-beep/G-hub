
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

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

const locations = [
  "Gataka",
  "Karen",
  "Rongai",
  "Cooperative University",
  "CUEA",
  "Multimedia University",
  "Tangaza University",
];

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  sold: "bg-blue-100 text-blue-800",
  unavailable: "bg-gray-100 text-gray-700",
};

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(Boolean(auth.currentUser));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return undefined;
    }

    const listingsQuery = query(
      collection(db, "listings"),
      where("sellerId", "==", user.uid)
    );

    return onSnapshot(
      listingsQuery,
      (snapshot) => {
        setListings(
          snapshot.docs
            .map((item) => ({
              id: item.id,
              ...item.data(),
            }))
            .sort(
              (a, b) =>
                (b.createdAt?.toMillis?.() ?? 0) -
                (a.createdAt?.toMillis?.() ?? 0)
            )
        );

        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(`Could not load your listings: ${snapshotError.message}`);
        setLoading(false);
      }
    );
  }, []);

  function startEditing(listing) {
    setEditingId(listing.id);
    setEditTitle(listing.title || "");
    setEditDescription(listing.description || "");
    setEditPrice(String(listing.price ?? ""));
    setEditCategory(listing.category || categories[0]);
    setEditLocation(listing.location || locations[0]);
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setMessage("");
    setError("");
  }

  async function saveChanges(listingId) {
    const user = auth.currentUser;
    const numericPrice = Number(editPrice);

    if (!user) {
      setError("Please log in before editing a listing.");
      return;
    }

    if (
      !editTitle.trim() ||
      !editDescription.trim() ||
      !editLocation.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Please enter a valid title, description, location and price.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateDoc(doc(db, "listings", listingId), {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: numericPrice,
        category: editCategory,
        location: editLocation.trim(),
      });

      setEditingId(null);
      setMessage("Your listing has been updated successfully.");
    } catch (updateError) {
      setError(`Could not update listing: ${updateError.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(listingId, newStatus) {
    setUpdatingStatusId(listingId);
    setError("");
    setMessage("");

    try {
      await updateDoc(doc(db, "listings", listingId), {
        status: newStatus,
      });

      setMessage("Listing status updated successfully.");
    } catch (statusError) {
      setError(`Could not update status: ${statusError.message}`);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleDelete(listingId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(listingId);
    setError("");
    setMessage("");

    try {
      await deleteDoc(doc(db, "listings", listingId));

      if (editingId === listingId) {
        setEditingId(null);
      }

      setMessage("Listing deleted successfully.");
    } catch (deleteError) {
      setError(`Could not delete listing: ${deleteError.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = listings.filter(
    (listing) => (listing.status || "active") === "active"
  ).length;

  const soldCount = listings.filter(
    (listing) => listing.status === "sold"
  ).length;

  const unavailableCount = listings.filter(
    (listing) => listing.status === "unavailable"
  ).length;

  if (loading) {
    return (
      <section className="min-h-64 px-4 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="font-medium text-gray-600">
          Loading your listings...
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Seller dashboard
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              My Listings
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your products, update prices and keep your listings fresh.
            </p>
          </div>

          <div className="flex h-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-2xl font-bold text-emerald-700">
              {listings.length}
            </span>
            <span className="text-sm text-gray-500">
              Total {listings.length === 1 ? "listing" : "listings"}
            </span>
          </div>
        </div>

        {/* Status summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {activeCount}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Visible to marketplace visitors
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Sold</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <span className="text-lg font-bold">✓</span>
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {soldCount}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Products you've sold
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Unavailable</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {unavailableCount}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Temporarily not available
            </p>
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}

        {/* Empty state */}
        {listings.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Your marketplace journey starts here
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              You haven't published any listings yet. Add your first product
              and let buyers around Gataka, Karen and Rongai discover it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => {
              const status = listing.status || "active";
              const isEditing = editingId === listing.id;

              return (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {isEditing ? (
                    <form
                      className="space-y-5 p-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveChanges(listing.id);
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">
                          Edit product
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                          Update your listing
                        </h2>
                      </div>

                      <div>
                        <label
                          htmlFor={`title-${listing.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                          Product title
                        </label>
                        <input
                          id={`title-${listing.id}`}
                          value={editTitle}
                          onChange={(event) =>
                            setEditTitle(event.target.value)
                          }
                          maxLength={100}
                          required
                          className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`description-${listing.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <textarea
                          id={`description-${listing.id}`}
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          maxLength={2000}
                          rows={4}
                          required
                          className="w-full resize-y rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`price-${listing.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                          Price (KSh)
                        </label>
                        <input
                          id={`price-${listing.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice}
                          onChange={(event) =>
                            setEditPrice(event.target.value)
                          }
                          required
                          className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`category-${listing.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          id={`category-${listing.id}`}
                          value={editCategory}
                          onChange={(event) =>
                            setEditCategory(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`location-${listing.id}`}
                          className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                          Location
                        </label>
                        <select
                          id={`location-${listing.id}`}
                          value={editLocation}
                          onChange={(event) =>
                            setEditLocation(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          {!locations.includes(editLocation) && editLocation && (
                            <option value={editLocation}>{editLocation}</option>
                          )}
                          {locations.map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Product image */}
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {listing.imageUrls?.[0] ? (
                          <img
                            src={listing.imageUrls[0]}
                            alt={listing.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            No product photo
                          </div>
                        )}

                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            statusStyles[status] || statusStyles.unavailable
                          }`}
                        >
                          {status}
                        </span>

                        {listing.imageUrls?.length > 1 && (
                          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                            {listing.imageUrls.length} photos
                          </span>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {listing.category || "Other Items"}
                          </span>

                          <span className="shrink-0 text-xs text-gray-500">
                            {listing.location}
                          </span>
                        </div>

                        <h2 className="line-clamp-2 text-lg font-bold text-gray-900">
                          {listing.title}
                        </h2>

                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                          {listing.description}
                        </p>

                        <p className="mt-4 text-2xl font-extrabold text-emerald-700">
                          KSh{" "}
                          {Number(listing.price).toLocaleString("en-KE")}
                        </p>

                        {/* Change status */}
                        <div className="mt-5 border-t border-gray-100 pt-4">
                          <label
                            htmlFor={`status-${listing.id}`}
                            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            Manage availability
                          </label>

                          <select
                            id={`status-${listing.id}`}
                            value={status}
                            disabled={updatingStatusId === listing.id}
                            onChange={(event) =>
                              handleStatusChange(listing.id, event.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                          >
                            <option value="active">Active — Show listing</option>
                            <option value="sold">Sold — Mark as sold</option>
                            <option value="unavailable">
                              Unavailable — Hide listing
                            </option>
                          </select>

                          {updatingStatusId === listing.id && (
                            <p className="mt-2 text-xs text-gray-500">
                              Updating status...
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(listing)}
                            disabled={deletingId === listing.id}
                            className="rounded-xl border border-emerald-200 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Edit Listing
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            className="rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === listing.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default MyListings;
