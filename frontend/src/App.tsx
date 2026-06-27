import { Routes, Route, Navigate } from "react-router-dom";
import TopNav from "./components/TopNav";
import Overview from "./pages/Overview";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Results from "./pages/Results";

export default function App() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/processing/:jobId" element={<Processing />} />
          <Route path="/results/:jobId" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
