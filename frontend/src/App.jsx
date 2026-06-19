import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Forecast from "./pages/Forecast";
import Inventory from "./pages/Inventory";
import Risks from "./pages/Risks";
import Recommendations from "./pages/Recommendations";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/risks" element={<Risks />} />
          <Route
            path="/recommendations"
            element={<Recommendations />}
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
