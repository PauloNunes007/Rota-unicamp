import React from "react";
import { createRoot } from "react-dom/client";
import "./storage.js";
import RotaUnicamp from "./RotaUnicamp.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RotaUnicamp />
  </React.StrictMode>
);
