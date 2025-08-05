import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { CommandIcon, HeartIcon, TriangleIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t w-full h-16">
      <div className="container flex items-center sm:justify-between justify-center sm:gap-0 gap-4 h-full text-muted-foreground text-sm flex-wrap sm:py-0 py-3 max-sm:px-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-primary rounded text-primary-foreground flex items-center justify-center text-xs font-bold sm:block hidden">
            M
          </div>
          <p className="text-center">
            © 2024 Mesa. High-performance React state management with fine-grained reactivity.
          </p>
        </div>

        <div className="gap-4 items-center hidden md:flex">
          <Link
            href="https://github.com/your-username/mesa"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function FooterButtons() {
  return null;
}
