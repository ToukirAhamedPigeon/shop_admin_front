import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes"; // 👈 import routes here
import RouteProgress from "@/components/module/admin/layout/RouteProgress";

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgress color="#3b82f6" darkColor="#ffffff" />
      <AppRoutes /> 
    </BrowserRouter>
  );
}
