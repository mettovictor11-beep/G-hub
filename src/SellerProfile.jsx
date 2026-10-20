
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

function SellerProfile() {
  const [profileType, setProfileType] = useState("personal");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("Gataka");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          uid: user.uid,
          profileType,
          displayName: displayName.trim(),
          businessName:
            profileType === "business" ? businessName.trim() : "",
          location,
          description: description.trim(),
          phone: phone.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Your profile has been saved!");
    } catch (error) {
      setMessage(`Could not save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ margin: "24px 0" }}>
      <h2>Create Your Seller Profile</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="profileType">Profile type</label>
        <select
          id="profileType"
          value={profileType}
          onChange={(e) => setProfileType(e.target.value)}
        >
          <option value="personal">Personal profile</option>
          <option value="business">Business profile</option>
        </select>

        {profileType === "personal" ? (
          <>
            <label htmlFor="displayName">Your display name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Kamau"
              maxLength={80}
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="businessName">Business name</label>
            <input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Rongai Beauty Studio"
              maxLength={100}
              required
            />
          </>
        )}

        <label htmlFor="profileLocation">Location</label>
        <select
          id="profileLocation"
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

        <label htmlFor="profileDescription">About you or your business</label>
        <textarea
          id="profileDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell buyers a little about yourself or your business"
          maxLength={1000}
        />

        <label htmlFor="profilePhone">Contact phone number</label>
        <input
          id="profilePhone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712345678"
          pattern="^(?:\+?254|0)[17][0-9]{8}$"
          title="Enter a valid Kenyan mobile number, e.g. 0712345678, 0112345678, or +254712345678"
          required
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </section>
  );
}

export default SellerProfile;
 