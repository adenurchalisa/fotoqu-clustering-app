import { Routes, Route, Navigate } from "react-router-dom";
import Overview from "./pages/Overview";
import Processing from "./pages/Processing";
import Results from "./pages/Results";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="/processing/:jobId" element={<Processing />} />
      <Route path="/results/:jobId" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
