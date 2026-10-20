
import { useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const MAX_LISTING_IMAGES = 3;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_SIZE = 170 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const CATEGORIES = [
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

const LOCATIONS = [
  "Gataka",
  "Karen",
  "Rongai",
  "Cooperative University",
  "CUEA",
  "Multimedia University",
  "Tangaza University",
];

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error("Could not compress one of the selected photos.")
          );
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
    reader.onerror = () =>
      reject(new Error("Could not read a compressed photo."));
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error(`Could not open ${file.name}.`));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Photo compression is not supported by this browser."
    );
  }

  const maxDimension = Math.max(
    image.naturalWidth,
    image.naturalHeight
  );

  for (const dimensionLimit of [1200, 900, 700, 500]) {
    const scale = Math.min(1, dimensionLimit / maxDimension);

    canvas.width = Math.max(
      1,
      Math.round(image.naturalWidth * scale)
    );
    canvas.height = Math.max(
      1,
      Math.round(image.naturalHeight * scale)
    );

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
  const [category, setCategory] = useState("Phones & Accessories");
  const [location, setLocation] = useState("Gataka");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");
  const [images, setImages] = useState([]);

  function handleImagesChange(event) {
    const selectedImages = Array.from(event.target.files || []);

    if (selectedImages.length > MAX_LISTING_IMAGES) {
      setMessage(
        `You can upload up to ${MAX_LISTING_IMAGES} photos per listing.`
      );
      event.target.value = "";
      setImages([]);
      return;
    }

    const invalidImage = selectedImages.find(
      (image) =>
        !ALLOWED_IMAGE_TYPES.has(image.type) ||
        image.size > MAX_IMAGE_SIZE
    );

    if (invalidImage) {
      setMessage(
        "Choose JPG, PNG, or WEBP photos that are each 10 MB or smaller."
      );
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
      setCategory("Phones & Accessories");
      setLocation("Gataka");
      e.target.reset();
      setMessage("Your product has been listed successfully!");
      onListingAdded?.();
    } catch (error) {
      setMessage(`Could not add listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
          Start selling
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          List your item
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Add accurate details and clear photos to help buyers in your
          community find your listing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="listing-title"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Product or service name *
          </label>
          <input
            id="listing-title"
            placeholder="e.g. Samsung Galaxy A54"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="listing-description"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Description *
          </label>
          <textarea
            id="listing-description"
            placeholder="Describe the item's condition, features, size, or other useful details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            required
            disabled={loading}
            className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {description.length}/2000 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="listing-images"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Product photos
          </label>
          <p className="mb-3 text-sm text-gray-500">
            Add up to 3 photos. Use JPG, PNG, or WEBP files, up to 10 MB
            each. Photos are compressed before saving.
          </p>

          <label
            htmlFor="listing-images"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50"
          >
            <span className="mb-2 text-3xl" aria-hidden="true">
              📷
            </span>
            <span className="font-bold text-gray-800">
              Choose product photos
            </span>
            <span className="mt-1 text-xs text-gray-500">
              {images.length} of {MAX_LISTING_IMAGES} photos selected
            </span>
          </label>

          <input
            id="listing-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
            disabled={loading}
            className="sr-only"
          />

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={`${image.name}-${image.lastModified}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Selected photo ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <p className="truncate px-2 py-2 text-xs text-gray-600">
                    Photo {index + 1}: {image.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="listing-price"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Price in Kenyan shillings (KSh) *
          </label>
          <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-600">
              KSh
            </span>
            <input
              id="listing-price"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={loading}
              className="min-w-0 flex-1 px-4 py-3 text-gray-900 outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="seller-phone"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            WhatsApp number *
          </label>
          <input
            id="seller-phone"
            type="tel"
            placeholder="0712345678"
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
            pattern="^(?:\+?254|0)[17][0-9]{8}$"
            title="Enter a valid Kenyan mobile number, e.g. 0712345678, 0112345678, or +254712345678"
            required
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Buyers can use this number to contact you about your listing.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="listing-category"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Category *
            </label>
            <select
              id="listing-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="listing-location"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Location *
            </label>
            <select
              id="listing-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {LOCATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Compressing photos and publishing..." : "Publish listing"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Please check your details before publishing.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${
              message.startsWith("Your product")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </section>
  );
}

export default AddListing;
