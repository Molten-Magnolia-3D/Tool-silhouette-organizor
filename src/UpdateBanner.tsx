import type { Platform } from "./platform";
import { useUpdateStatus } from "./useUpdateStatus";

export function UpdateBanner({ platform }: { platform: Platform }) {
  const status = useUpdateStatus(platform);
  if (status?.state === "downloading") {
    return <div className="banner">{status.message}</div>;
  }
  if (status?.state !== "ready") return null;
  return (
    <div className="banner row">
      <span>{status.message}</span>
      <button type="button" className="primary" onClick={() => void platform.installUpdate()}>
        Update now
      </button>
    </div>
  );
}
