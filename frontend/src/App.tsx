import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Main from "./pages/Main";
import Dashboard from "./pages/Dashboard";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import type { ChatTurn } from "./types";

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("ps_theme");
    return saved === "light" ? "light" : "dark";
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  useEffect(() => {
    localStorage.setItem("ps_theme", theme);
  }, [theme]);

  const startApp = (_mode: "solo" | "enterprise") => {
    setIsTransitioning(true);


    // Reset old chat data when launching a new session mode
    setTurns([]);
    localStorage.removeItem("ps_vault");
    localStorage.removeItem("ps_turns");

    setTimeout(() => {
      navigate("/app");
      setIsTransitioning(false);
    }, 350);
  };

  return (
    <div
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: "opacity 350ms ease",
        height: "100vh",
      }}
    >
      <Routes location={location}>
        <Route path="/" element={<Landing startApp={startApp} />} />
        <Route
          path="/app"
          element={
            <Main
              theme={theme}
              setTheme={setTheme}
              turns={turns}
              setTurns={setTurns}
            />
          }
        />
        <Route
          path="/dashboard"
          element={<Dashboard theme={theme} setTheme={setTheme} />}
        />
        <Route
          path="/enterprise"
          element={<EnterpriseDashboard theme={theme} setTheme={setTheme} />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;
