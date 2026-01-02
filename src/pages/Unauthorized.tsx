import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-125px)] bg-gray-50 text-center dark:bg-gray-900 dark:text-white">
      <h1 className="text-6xl font-bold text-red-500 mb-4 dark:text-white">403</h1>
      <h2 className="text-2xl font-semibold mb-2 dark:text-white">Unauthorized Access</h2>
      <p className="text-gray-600 mb-6 dark:text-white">
        You do not have permission to view this page.
      </p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}
