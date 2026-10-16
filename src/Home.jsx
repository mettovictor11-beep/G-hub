

import AddListing from "./AddListing";
import ListingFeed from "./ListingFeed";
import MyListings from "./MyListings";

function Home({ user, onLogout }) {
  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>G-hub</h1>
      <p>Welcome, {user.displayName || user.email}!</p>

      <AddListing />
      <ListingFeed />
      <MyListings />
<button onClick={onLogout}>Logout</button>

      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Home;
