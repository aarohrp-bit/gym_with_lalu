import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProfileSelect from "@/pages/ProfileSelect";
import AddProfile from "@/pages/AddProfile";
import PinPad from "@/pages/PinPad";
import Dashboard from "@/pages/Dashboard";
import DayDetail from "@/pages/DayDetail";
import Workout from "@/pages/Workout";
import Summary from "@/pages/Summary";
import Settings from "@/pages/Settings";
import Tutorial from "@/pages/Tutorial";
import Stats from "@/pages/Stats";
import CreateCard from "@/pages/CreateCard";

// Router basename so routes resolve under the GitHub Pages subpath (/gym_with_lalu)
// while staying "/" for local dev (CRA sets PUBLIC_URL="" in development).
const getBasename = () => {
  const pub = process.env.PUBLIC_URL;
  if (!pub) return "/";
  try {
    return new URL(pub, window.location.origin).pathname || "/";
  } catch {
    return pub.startsWith("/") ? pub : "/";
  }
};

function App() {
  // Dev hooks: ?fastTimer=1 / ?fastGuard=1 persist across React Router nav via sessionStorage
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fastTimer") === "1") {
      window.sessionStorage.setItem("fastTimer", "1");
    }
    if (params.get("fastGuard") === "1") {
      window.sessionStorage.setItem("fastGuard", "1");
    }
  }
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route path="/" element={<ProfileSelect />} />
          <Route path="/add-profile" element={<AddProfile />} />
          <Route path="/pin/:profileId" element={<PinPad />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/day/:day" element={<DayDetail />} />
          <Route path="/workout/:day" element={<Workout />} />
          <Route path="/summary/:day" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/create-card" element={<CreateCard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
