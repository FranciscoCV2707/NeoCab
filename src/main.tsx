import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import MarqueeView from "./components/MarqueeView";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

if (window.location.pathname.includes("marquee") || window.location.search.includes("marquee")) {
  root.render(<MarqueeView />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
