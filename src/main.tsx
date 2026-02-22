import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // <--- 关键：必须引入这个文件！

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
