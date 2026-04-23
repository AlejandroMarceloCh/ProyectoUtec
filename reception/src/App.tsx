import { useState } from "react";
import { LoginScreen } from "./screens/LoginScreen";
import { ReceptionScreen } from "./screens/ReceptionScreen";
import { getToken } from "./api";

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn || !getToken()) {
    return <LoginScreen onSuccess={() => setLoggedIn(true)} />;
  }

  return <ReceptionScreen onLogout={() => setLoggedIn(false)} />;
}
