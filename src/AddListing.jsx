
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

function AddListing({ onListingAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("Gataka");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setMessage("Enter a valid, non-negative price.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await addDoc(collection(db, "listings"), {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        category,
        location: location.trim(),
        sellerId: user.uid,
        sellerName: user.displayName || user.email,
        status: "active",
        createdAt: serverTimestamp(),
        sellerPhone: sellerPhone.trim(),
      });

      setTitle("");
      setDescription("");
      setPrice("");
      setMessage("Your product has been listed!");
      onListingAdded?.();
    } catch (error) {
      setMessage(`Could not add listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Sell an item</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Product title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
        />

        <textarea
          placeholder="Product description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          required
        />

        <input
          type="number"
          placeholder="Price in KSh"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        
<input
  type="tel"
  placeholder="WhatsApp number (e.g. 0712345678)"
  value={sellerPhone}
  onChange={(e) => setSellerPhone(e.target.value)}
  pattern="^(?:\+?254|0)[17][0-9]{8}$"
  title="Enter a valid Kenyan mobile number, e.g. 0712345678, 0112345678, or +254712345678"
  required
/>


      
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
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
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>Gataka</option>
          <option>Karen</option>
          <option>Rongai</option>
          <option>Cooperative University</option>
          <option>CUEA</option>
          <option>Multimedia University</option>
          <option>Tangaza University</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "Publish listing"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}

export default AddListing;
