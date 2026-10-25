import { useMemo } from "react";
import { Studio } from "./components/Studio";
import { createPlatform } from "./platform";
import { UpdateBanner } from "./UpdateBanner";

export function App() {
  const platform = useMemo(() => createPlatform(), []);
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden="true" />
          <div>
            <strong>Pocketplate</strong>
            <small>Molten Magnolia 3D · tool silhouette organizer</small>
          </div>
        </div>
        <p className="eyebrow header-note">
          {platform.isElectron ? "Windows shop build" : "Browser studio"}
        </p>
      </header>
      <UpdateBanner platform={platform} />
      <Studio platform={platform} />
    </div>
  );
}
