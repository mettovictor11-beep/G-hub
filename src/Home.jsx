
import AddListing from "./AddListing";
import ListingFeed from "./ListingFeed";
import MyListings from "./MyListings";
import SellerProfile from "./SellerProfile";
import { useNavigate } from "react-router-dom";

function Home({ user, onLogout }) {
  const navigate = useNavigate();

  function requireLogin() {
    navigate("/login");
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Gataka Connect</h1>

      {user ? (
        <p>Welcome, {user.displayName || user.email}!</p>
      ) : (
        <p>Discover products around Gataka, Karen and Rongai.</p>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {user ? (
          <>
            <button onClick={() => navigate("/inbox")}>
              My Messages
            </button>

            <button onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => navigate("/login")}>
            Sign In / Register
          </button>
        )}
      </div>

      {user ? (
        <>
          <SellerProfile />
          <AddListing />
        </>
      ) : (
        <button
          onClick={requireLogin}
          style={{ marginBottom: "20px" }}
        >
          Sell an Item — Sign In
        </button>
      )}

      <h2>Explore Listings</h2>
      <ListingFeed user={user} />

      {user && <MyListings />}
    </div>
  );
}

export default Home;
