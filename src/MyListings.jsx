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

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return undefined;

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
    setEditTitle(listing.title);
    setEditDescription(listing.description);
    setEditPrice(String(listing.price));
    setEditCategory(listing.category);
    setEditLocation(listing.location);
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setMessage("");
  }

  async function saveChanges(listingId) {
    const user = auth.currentUser;
    const numericPrice = Number(editPrice);

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    if (
      !editTitle.trim() ||
      !editDescription.trim() ||
      !editLocation.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setMessage("Please enter valid listing details.");
      return;
    }

    try {
      await updateDoc(doc(db, "listings", listingId), {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: numericPrice,
        category: editCategory,
        location: editLocation.trim(),
      });

      setEditingId(null);
      setError("");
      setMessage("Listing updated successfully!");
    } catch (updateError) {
      setError(`Could not update listing: ${updateError.message}`);
    }
  }

  async function handleDelete(listingId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "listings", listingId));
      setError("");
      setMessage("Listing deleted successfully.");
    } catch (deleteError) {
      setError(`Could not delete listing: ${deleteError.message}`);
    }
  }

  if (loading) return <p>Loading your listings...</p>;

  return (
    <section>
      <h2>My Listings</h2>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      {!error && listings.length === 0 && (
        <p>You haven't published any listings yet.</p>
      )}

      {listings.map((listing) => (
        <article
          key={listing.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "12px",
          }}
        >
          {editingId === listing.id ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveChanges(listing.id);
              }}
            >
              <h3>Edit Listing</h3>

              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Product title"
                maxLength={100}
                required
              />

              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Description"
                maxLength={2000}
                required
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
                placeholder="Price in KSh"
                required
              />

              <select
                value={editCategory}
                onChange={(event) => setEditCategory(event.target.value)}
              >
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

              <select
                value={editLocation}
                onChange={(event) => setEditLocation(event.target.value)}
              >
                <option>Gataka</option>
                <option>Karen</option>
                <option>Rongai</option>
                <option>Cooperative University</option>
                <option>CUEA</option>
                <option>Multimedia University</option>
                <option>Tangaza University</option>
              </select>

              <button type="submit">Save Changes</button>
              <button type="button" onClick={cancelEditing}>
                Cancel
              </button>
            </form>
          ) : (
            <>
              <h3>{listing.title}</h3>
              <p>{listing.description}</p>
              <strong>
                KSh {Number(listing.price).toLocaleString("en-KE")}
              </strong>
              <p>Category: {listing.category}</p>
              <p>Location: {listing.location}</p>
              <p>Status: {listing.status}</p>
              
<label>
  Listing status:{" "}
  <select
    value={listing.status || "active"}
    onChange={async (e) => {
      try {
        await updateDoc(doc(db, "listings", listing.id), {
          status: e.target.value,
        });
        setMessage("Listing status updated!");
      } catch (error) {
        setMessage(`Could not update status: ${error.message}`);
      }
    }}
  >
    <option value="active">Active</option>
    <option value="sold">Sold</option>
    <option value="unavailable">Unavailable</option>
  </select>
</label>


              <button onClick={() => startEditing(listing)}>
                Edit Listing
              </button>
              <button onClick={() => handleDelete(listing.id)}>
                Delete Listing
              </button>
            </>
          )}
        </article>
      ))}
    </section>
  );
}

export default MyListings;
