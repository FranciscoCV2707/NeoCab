import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { t } from "../i18n";

interface UpdateInfo {
  available: boolean;
  version: string | null;
  download_url: string | null;
  changelog: string | null;
}

interface DownloadProgress {
  percentage: number;
  downloaded: number;
  total: number;
}

export default function UpdaterPanel() {
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleCheck = useCallback(async () => {
    setChecking(true);
    setStatus(t("updater.check"));
    setUpdateInfo(null);
    try {
      const info = await invoke<UpdateInfo>("check_for_updates");
      setUpdateInfo(info);
      if (info.available) {
        setStatus(t("updater.available") + ` v${info.version}`);
      } else {
        setStatus(t("updater.up_to_date"));
      }
    } catch (e) {
      setStatus(`${t("updater.error")}: ${e}`);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!updateInfo?.download_url) return;
    setDownloading(true);
    setProgress(null);
    setStatus(t("updater.downloading"));

    const unlisten = await listen<DownloadProgress>("update_download_progress", (event) => {
      setProgress(event.payload);
    });

    try {
      const zipPath = await invoke<string>("download_update", {
        url: updateInfo.download_url,
      });
      setStatus(t("updater.downloading") + " " + t("updater.complete"));

      // Apply update
      setStatus(t("updater.restart"));
      await invoke("apply_update", { zipPath });
    } catch (e) {
      setStatus(`${t("updater.error")}: ${e}`);
    } finally {
      unlisten();
      setDownloading(false);
    }
  }, [updateInfo]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="updater-panel">
      <h3>{t("updater.check")}</h3>

      <button
        className="updater-check-btn"
        onClick={handleCheck}
        disabled={checking || downloading}
      >
        {checking ? t("menu.loading") : t("updater.check")}
      </button>

      {status && (
        <div className="updater-status">{status}</div>
      )}

      {progress && (
        <div className="updater-progress-container">
          <div className="updater-progress-bar">
            <div
              className="updater-progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="updater-progress-text">
            {progress.percentage}% ({formatBytes(progress.downloaded)} / {formatBytes(progress.total)})
          </span>
        </div>
      )}

      {updateInfo?.available && !downloading && (
        <>
          <div className="updater-changelog">
            <h4>{t("updater.changelog")}</h4>
            <pre>{updateInfo.changelog || t("nav.back")}</pre>
          </div>
          <button
            className="updater-download-btn"
            onClick={handleDownload}
          >
            {t("settings.updates")} v{updateInfo.version}
          </button>
        </>
      )}

      {updateInfo?.available === false && (
        <div className="updater-up-to-date">
          ✅ {t("updater.up_to_date")}
        </div>
      )}
    </div>
  );
}
