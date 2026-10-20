
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { auth } from "./firebase";
import Auth from "./Auth";
import Home from "./Home";
import Chat from "./Chat";
import Inbox from "./Inbox";

function ChatRoute() {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Chat
      conversationId={conversationId}
      otherUserName={location.state?.otherUserName || "seller"}
      onBack={() => navigate(-1)}
    />
  );
}


function InboxRoute() {
  const navigate = useNavigate();

  return (
    <Inbox
      onOpenChat={({ conversationId, otherUserName }) => {
        navigate(`/chat/${conversationId}`, {
          state: { otherUserName },
        });
      }}
    />
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  if (checkingAuth) {
    return <p>Loading Gataka Connect...</p>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Routes>
  <Route
    path="/chat/:conversationId"
    element={<ChatRoute />}
  />

  <Route
    path="/inbox"
    element={<InboxRoute />}
  />

  <Route
    path="*"
    element={<Home user={user} onLogout={handleLogout} />}
  />
</Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
