import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ShieldOff } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-125px)] text-center px-4">
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="text-8xl font-black tracking-tighter select-none text-destructive"
          style={{ letterSpacing: '-0.04em', lineHeight: 1 }}
        >
          403
        </div>

        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            You don't have permission to view this page.
          </p>
        </div>

        <Button
          asChild
          variant="destructive"
          className="mt-2 h-10 px-6 gap-2 font-semibold text-sm"
        >
          <Link to="/">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
