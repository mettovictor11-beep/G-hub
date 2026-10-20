
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const locations = [
  "Gataka",
  "Karen",
  "Rongai",
  "Cooperative University",
  "CUEA",
  "Multimedia University",
  "Tangaza University",
];

function SellerProfile() {
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState("personal");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("Gataka");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const user = auth.currentUser;

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "profiles", user.uid);
        const snapshot = await getDoc(profileRef);

        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          setProfile(data);
          setProfileType(data.profileType || "personal");
          setDisplayName(data.displayName || "");
          setBusinessName(data.businessName || "");
          setLocation(data.location || "Gataka");
          setDescription(data.description || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(`Could not load your profile: ${error.message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    if (profileType === "business" && !businessName.trim()) {
      setMessage("Please enter your business name.");
      return;
    }

    if (profileType === "personal" && !displayName.trim()) {
      setMessage("Please enter your display name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const profileData = {
      uid: user.uid,
      profileType,
      displayName: displayName.trim(),
      businessName:
        profileType === "business" ? businessName.trim() : "",
      location,
      description: description.trim(),
      phone: phone.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        profileData,
        { merge: true }
      );

      setProfile({
        ...profileData,
        updatedAt: new Date(),
      });
      setEditing(false);
      setMessage("Your profile has been saved successfully!");
    } catch (error) {
      setMessage(`Could not save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    if (profile) {
      setProfileType(profile.profileType || "personal");
      setDisplayName(profile.displayName || "");
      setBusinessName(profile.businessName || "");
      setLocation(profile.location || "Gataka");
      setDescription(profile.description || "");
      setPhone(profile.phone || "");
      setEditing(false);
      setMessage("");
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

  const labelClass = "block text-sm font-semibold text-gray-700";

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 py-4">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-100" />
        <div className="h-16 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (profile && !editing) {
    const sellerName =
      profile.profileType === "business"
        ? profile.businessName
        : profile.displayName;

    return (
      <section className="my-2">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              {profile.profileType === "business" ? "🏬" : "👤"}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {sellerName}
                </h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                  {profile.profileType} seller
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                <span aria-hidden="true">📍</span> {profile.location}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <span aria-hidden="true">✏️</span> Edit Profile
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contact phone
            </p>
            <p className="mt-1 break-words font-medium text-gray-900">
              {profile.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Seller type
            </p>
            <p className="mt-1 font-medium capitalize text-gray-900">
              {profile.profileType} seller
            </p>
          </div>

          {profile.description && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                About
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {profile.description}
              </p>
            </div>
          )}
        </div>

        {message && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="my-2">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
          🏪
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {profile ? "Edit Seller Profile" : "Create Your Seller Profile"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {profile
              ? "Update your details so buyers know who they are buying from."
              : "Introduce yourself to buyers in your community."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className={labelClass}>What type of seller are you?</p>

          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setProfileType("personal");
                setMessage("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                profileType === "personal"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-xl">👤</span>
              <span className="mt-2 block font-bold text-gray-900">
                Personal seller
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Selling your own items
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileType("business");
                setMessage("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                profileType === "business"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-xl">🏬</span>
              <span className="mt-2 block font-bold text-gray-900">
                Business seller
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Representing a business or shop
              </span>
            </button>
          </div>
        </div>

        {profileType === "personal" ? (
          <div>
            <label htmlFor="displayName" className={labelClass}>
              Your display name
            </label>
            <input
              id="displayName"
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Kamau"
              maxLength={80}
              autoComplete="name"
              required
            />
          </div>
        ) : (
          <div>
            <label htmlFor="businessName" className={labelClass}>
              Business name
            </label>
            <input
              id="businessName"
              className={inputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Rongai Beauty Studio"
              maxLength={100}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="profileLocation" className={labelClass}>
            Your location
          </label>
          <select
            id="profileLocation"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            {locations.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="profileDescription" className={labelClass}>
            About you or your business (optional)
          </label>
          <textarea
            id="profileDescription"
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell buyers what you sell or what services you offer..."
            maxLength={1000}
            rows={4}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {description.length}/1000 characters
          </p>
        </div>

        <div>
          <label htmlFor="profilePhone" className={labelClass}>
            Contact phone number
          </label>
          <input
            id="profilePhone"
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712345678"
            pattern="^(?:\+?254|0)[17][0-9]{8}$"
            title="Enter a valid Kenyan mobile number, e.g. 0712345678, 0112345678, or +254712345678"
            autoComplete="tel"
            required
          />
        </div>

        {message && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm font-medium ${
              message.includes("successfully")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
          >
            {saving
              ? "Saving your profile..."
              : profile
                ? "Save Changes"
                : "Create Seller Profile"}
          </button>

          {profile && (
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-5 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default SellerProfile;
