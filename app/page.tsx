import Map from "./components/Map";
import TopBar from "./components/Header";
import Fab from "./components/Fab";
import ReportFlow from "./components/ReportFlow";
import DirectionsPanel from "./components/DirectionsPanel";
import WelcomeCard from "./components/WelcomeCard";
import Feedback from "./components/Feedback";

export default function Home() {
  // Full-screen map with the UI floating on top (modern map-app layout).
  return (
    <main className="relative flex-1 overflow-hidden">
      <Map />
      <TopBar />
      <Fab />
      <Feedback />
      <ReportFlow />
      <DirectionsPanel />
      <WelcomeCard />
    </main>
  );
}
