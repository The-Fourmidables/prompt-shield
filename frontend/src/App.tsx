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

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("ps_theme");
    return saved === "light" ? "light" : "dark";
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    localStorage.setItem("ps_theme", theme);
  }, [theme]);

  useEffect(() => {
    navigate("/");
  }, []);

  const startApp = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      navigate("/app");
      setIsTransitioning(false);
    }, 350); // animation duration
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
          element={<Main theme={theme} setTheme={setTheme} />}
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