import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker (local file for offline support)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

createRoot(document.getElementById("root")!).render(<App />);
