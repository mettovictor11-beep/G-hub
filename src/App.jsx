

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import Home from "./Home";

function App() {
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

  return user ? (
    <Home user={user} onLogout={handleLogout} />
  ) : (
    <Auth />
  );
}

export default App;
;
