import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Main from "./pages/Main";

function AppWrapper() {
  const navigate = useNavigate();

  // 🔐 Load theme from localStorage (or default to dark)
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("ps_theme");
    return saved === "light" ? "light" : "dark";
  });

  // 💾 Persist theme whenever it changes
  useEffect(() => {
    localStorage.setItem("ps_theme", theme);
  }, [theme]);

  // 🔥 Force landing on refresh
  useEffect(() => {
    navigate("/");
  }, []);


  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/app"
        element={<Main theme={theme} setTheme={setTheme} />}
      />
    </Routes>
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