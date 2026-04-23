import { useState } from "react";
import { LoginScreen } from "./screens/LoginScreen";
import { ReceptionScreen } from "./screens/ReceptionScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import { DisplayScreen } from "./screens/DisplayScreen";
import { getToken } from "./api";

type Route = "display" | "scanner" | "reception";

function getRoute(): Route {
  const path = window.location.pathname;
  if (path.startsWith("/display")) return "display";
  if (path.startsWith("/scanner")) return "scanner";
  return "reception";
}

export function App() {
  const route = getRoute();
  const [loggedIn, setLoggedIn] = useState(() => !!getToken());

  // /display es público — no necesita login
  if (route === "display") {
    return <DisplayScreen />;
  }

  // /scanner y / necesitan login como staff
  if (!loggedIn || !getToken()) {
    return <LoginScreen onSuccess={() => setLoggedIn(true)} />;
  }

  if (route === "scanner") {
    return <ScannerScreen onLogout={() => setLoggedIn(false)} />;
  }

  return <ReceptionScreen onLogout={() => setLoggedIn(false)} />;
}
