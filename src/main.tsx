import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

createRoot(document.getElementById("root")!).render(<App />);
