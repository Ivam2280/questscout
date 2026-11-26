import ReactDOM from "react-dom/client";
import App from "./App";
import { RuntimeConfigProvider } from "./config";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <RuntimeConfigProvider>
    <App />
  </RuntimeConfigProvider>,
);
