import Link from "next/link";
import { buttonVariants } from "./ui/button";

export function Footer() {
  return (
    <footer className="border-t w-full h-16">
      <div className="container flex items-center sm:justify-between justify-center sm:gap-0 gap-4 h-full text-muted-foreground text-sm flex-wrap sm:py-0 py-3 max-sm:px-4">
        <div className="flex items-center gap-3">
          © 2025 Mesa. High-performance React state management with fine-grained reactivity.
        </div>

        <div className="gap-4 items-center hidden md:flex">
          <Link href="https://github.com/lurgi/mesa" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
