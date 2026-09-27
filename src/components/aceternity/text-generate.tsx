// Aceternity-style "text generate" effect: words fade in from a soft blur.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextGenerate({ text, className, delay = 0 }: TextGenerateProps) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) return <p className={className}>{text}</p>;

  return (
    <p className={cn(className)} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </p>
  );
}
