//App.tsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes"; // 👈 import routes here
import RouteProgress from "@/components/module/admin/layout/RouteProgress";

export default function App() {
//   console.table({
//     'accessToken exists': !!localStorage.getItem('accessToken'),
//     'user exists': !!localStorage.getItem('user'),
//     'refreshToken cookie': document.cookie.includes('refreshToken'),
//     'current path': window.location.pathname
// });
  return (
    <BrowserRouter>
      <RouteProgress color="#3b82f6" darkColor="#ffffff" />
      <AppRoutes /> 
    </BrowserRouter>
  );
}
