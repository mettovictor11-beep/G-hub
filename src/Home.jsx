
import AddListing from "./AddListing";
import ListingFeed from "./ListingFeed";
import MyListings from "./MyListings";
import SellerProfile from "./SellerProfile";
import { useNavigate } from "react-router-dom";

function Home({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>G-hub</h1>
      <p>Welcome, {user.displayName || user.email}!</p>

      <button
        onClick={() => navigate("/inbox")}
        style={{ marginBottom: "20px", padding: "10px 16px" }}
      >
        My Messages
      </button>

      <SellerProfile />
      <AddListing />
      <ListingFeed />
      <MyListings />

      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Home;
