
import AddListing from "./AddListing";
import ListingFeed from "./ListingFeed";
import MyListings from "./MyListings";
import SellerProfile from "./SellerProfile";
import { useNavigate } from "react-router-dom";

function Home({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-left text-2xl font-extrabold tracking-tight text-emerald-700"
          >
            Gataka Connect
          </button>

          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/inbox")}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Messages
                </button>

                <button
                  onClick={onLogout}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
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
              onClick={() =>
                user ? document.getElementById("sell-item")?.scrollIntoView({
                  behavior: "smooth",
                }) : navigate("/login")
              }
              className="rounded-xl border border-emerald-300 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              Sell an item
            </button>
          </div>
        </section>

        {/* Account welcome */}
        {user && (
          <p className="mb-6 text-sm text-gray-600">
            Welcome back,{" "}
            <span className="font-semibold text-gray-900">
              {user.displayName || user.email}
            </span>
          </p>
        )}

        {/* Selling tools for signed-in users */}
        {user && (
          <section id="sell-item" className="mb-10 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Your marketplace</h2>
              <p className="mt-1 text-gray-600">
                Manage your seller profile and listings.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <SellerProfile />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <AddListing />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <MyListings />
            </div>
          </section>
        )}

        {/* Public listings */}
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
            <ListingFeed user={user} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Gataka Connect. Connecting our community.
        </footer>
      </main>
    </div>
  );
}

export default Home;
