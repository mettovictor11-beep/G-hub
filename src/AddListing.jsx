
import { useState } from "react";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const MAX_LISTING_IMAGES = 3;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_SIZE = 170 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not compress one of the selected photos."));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read a compressed photo."));
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Could not open ${file.name}.`));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Photo compression is not supported by this browser.");
  }

  const maxDimension = Math.max(image.naturalWidth, image.naturalHeight);

  for (const dimensionLimit of [1200, 900, 700, 500]) {
    const scale = Math.min(1, dimensionLimit / maxDimension);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await canvasToBlob(canvas, quality);

      if (blob.size <= MAX_COMPRESSED_IMAGE_SIZE) {
        return blobToDataUrl(blob);
      }
    }
  }

  throw new Error(
    "A photo is too detailed to fit safely in Firestore. Please choose a smaller photo."
  );
}

function AddListing({ onListingAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("Gataka");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");
  const [images, setImages] = useState([]);

  function handleImagesChange(event) {
    const selectedImages = Array.from(event.target.files || []);

    if (selectedImages.length > MAX_LISTING_IMAGES) {
      setMessage(`You can upload up to ${MAX_LISTING_IMAGES} photos per listing.`);
      event.target.value = "";
      setImages([]);
      return;
    }

    const invalidImage = selectedImages.find(
      (image) =>
        !ALLOWED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_SIZE
    );

    if (invalidImage) {
      setMessage("Choose JPG, PNG, or WEBP photos that are each 10 MB or smaller.");
      event.target.value = "";
      setImages([]);
      return;
    }

    setImages(selectedImages);
    setMessage("");
  }

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

    const listingRef = doc(collection(db, "listings"));

    try {
      const imageUrls = await Promise.all(images.map(compressImage));

      await setDoc(listingRef, {
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
        imageUrls,
      });

      setTitle("");
      setDescription("");
      setPrice("");
      setSellerPhone("");
      setImages([]);
      e.target.reset();
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

        <label htmlFor="listing-images">
          Product photos (up to {MAX_LISTING_IMAGES}, 10 MB each; compressed for Firestore)
        </label>
        <input
          id="listing-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleImagesChange}
          disabled={loading}
        />
        {images.length > 0 && (
          <ul>
            {images.map((image) => (
              <li key={`${image.name}-${image.lastModified}`}>
                {image.name}
              </li>
            ))}
          </ul>
        )}

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
