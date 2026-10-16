
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";

function Auth() {
  const [isRegistering, setIsRegistering] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, {
          displayName: name,
        });

        setMessage("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Logged in successfully!");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h1>G-hub</h1>
      <h2>{isRegistering ? "Create an account" : "Welcome back"}</h2>

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isRegistering
              ? "Register"
              : "Login"}
        </button>
      </form>

      <p>{message}</p>

      <button
        type="button"
        onClick={() => {
          setIsRegistering(!isRegistering);
          setMessage("");
        }}
      >
        {isRegistering
          ? "Already have an account? Login"
          : "New here? Create an account"}
      </button>
    </div>
  );
}

export default Auth;
