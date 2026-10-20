
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";

import { db } from "./firebase";
import AddListing from "./AddListing";
import ListingFeed from "./ListingFeed";
import MyListings from "./MyListings";
import SellerProfile from "./SellerProfile";

function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSellerCenter, setShowSellerCenter] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (!user || !showSellerCenter) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("sell-item")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [user, showSellerCenter]);

  useEffect(() => {
    const uid = user?.uid;

    if (!uid) {
      setMyListings([]);
      setDashboardLoading(false);
      setDashboardError("");
      return;
    }

    setDashboardLoading(true);

    const listingsQuery = query(
      collection(db, "listings"),
      where("sellerId", "==", uid)
    );

    const unsubscribe = onSnapshot(
      listingsQuery,
      (snapshot) => {
        setMyListings(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setDashboardError("");
        setDashboardLoading(false);
      },
      (error) => {
        setDashboardError(
          `Could not load dashboard statistics: ${error.message}`
        );
        setDashboardLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const totalListings = myListings.length;

  // Listings without a status are treated as active for older records.
  const activeListings = myListings.filter(
    (listing) => !listing.status || listing.status === "active"
  ).length;

  const soldListings = myListings.filter(
    (listing) => listing.status === "sold"
  ).length;

  const dashboardCards = [
    {
      title: "Total Listings",
      value: totalListings,
      description: "Products you've posted",
      
    },
    {
      title: "Active Listings",
      value: activeListings,
      description: "Available to buyers",
      
    },
    {
      title: "Sold Items",
      value: soldListings,
      description: "Items marked as sold",
      
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="text-left text-2xl font-extrabold tracking-tight text-emerald-700"
          >
            G-Hub Connect
          </button>

          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/inbox")}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Messages
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome banner */}
        <section className="mb-10 overflow-hidden rounded-3xl bg-emerald-800 px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-200">
            Your community marketplace
          </p>

          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Buy, sell and connect around your community.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50 sm:text-lg">
            Discover products and services around Gataka, Karen, Rongai
            and nearby university communities.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                document.getElementById("marketplace")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="rounded-xl bg-white px-5 py-3 font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Explore listings
            </button>

            <button
              type="button"
              onClick={() =>
                user ? setShowSellerCenter(true) : navigate("/login")
              }
              className="rounded-xl border border-emerald-300 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              Sell an item
            </button>
          </div>
        </section>

        {/* Seller dashboard */}
        {user && showSellerCenter && (
          <section id="sell-item" className="mb-12 scroll-mt-24">
            <div className="mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                    Seller centre
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                    Start selling
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Set up your seller profile, then list your items.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSellerCenter(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                >
                  Back to marketplace
                </button>
              </div>
            </div>

            {/* Live summary cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dashboardCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-600">
                      {card.title}
                    </p>

                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                      {card.icon}
                    </span>
                  </div>

                  <p className="mt-4 text-3xl font-extrabold text-gray-900">
                    {dashboardLoading ? "..." : card.value}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {dashboardError && (
              <p
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {dashboardError}
              </p>
            )}

            {/* Seller profile */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <SellerProfile />
            </div>

            {/* Add listing */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <AddListing />
            </div>

            {/* Manage listings */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <MyListings />
            </div>
          </section>
        )}

        {/* Public marketplace */}
        <section id="marketplace" className="scroll-mt-24">
          <div className="mb-5">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Explore the marketplace
            </h2>

            <p className="mt-2 text-gray-600">
              Find something useful or discover a service near you.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <ListingFeed
              user={user}
              initialListingId={location.state?.listingId}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} G-Hub Connect. Connecting our community.
        </footer>
      </main>
    </div>
  );
}

export default Home;
