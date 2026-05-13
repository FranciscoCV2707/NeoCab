import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./Marquee.css";

interface GameFocusedEvent {
  title: string;
  marquee_path?: string;
  image_path?: string;
  system_name?: string;
}

export default function MarqueeView() {
  const [currentMarquee, setCurrentMarquee] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("NeoCab Arcade");
  const [systemName, setSystemName] = useState<string>("");

  useEffect(() => {
    // Listen for events emitted by the main window
    const unlisten = listen<GameFocusedEvent>("game_focused", (event) => {
      const { title, marquee_path, image_path, system_name } = event.payload;
      setCurrentTitle(title);
      if (system_name) setSystemName(system_name);
      
      if (marquee_path) {
        setCurrentMarquee(resolveAssetPath(marquee_path));
      } else if (image_path) {
        // Fallback to title image if no marquee
        setCurrentMarquee(resolveAssetPath(image_path));
      } else {
        setCurrentMarquee(null);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const resolveAssetPath = (path: string) => {
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  };

  const isVideo = (path: string | null) => {
    if (!path) return false;
    const ext = path.toLowerCase().split('.').pop();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
  };

  return (
    <div className="marquee-container">
      {currentMarquee ? (
        isVideo(currentMarquee) ? (
          <video 
            src={currentMarquee} 
            autoPlay 
            loop 
            muted 
            className="marquee-image" 
          />
        ) : (
          <img 
            src={currentMarquee} 
            alt={currentTitle} 
            className="marquee-image" 
          />
        )
      ) : (
        <div className="marquee-text-fallback">
          <h2 className="marquee-system">{systemName}</h2>
          <h1 className="marquee-title">{currentTitle}</h1>
        </div>
      )}
    </div>
  );
}
