import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-125px)] bg-gray-50 text-center dark:bg-gray-900 dark:text-white">
      <h1 className="text-6xl font-bold text-gray-700 mb-4 dark:text-white">404</h1>
      <h2 className="text-2xl font-semibold mb-2 dark:text-white">Page Not Found</h2>
      <p className="text-gray-600 mb-6 dark:text-white">
        The page you're looking for doesn't exist.
      </p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}
