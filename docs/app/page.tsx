"use client";
import DarkVeil from "@/components/ogl/dark-veil";
import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes-config";
import { TerminalSquareIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLayoutEffect } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();

  useLayoutEffect(() => {
    if (theme === "light") {
      setTheme("dark");
    }
  }, [setTheme, theme]);

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full absolute top-0 left-0 z-[-1] ">
        <DarkVeil speed={0.8} noiseIntensity={0.15} hueShift={27} />
      </div>

      <div className="mx-[10%] flex sm:min-h-[87.5vh] min-h-[82vh] flex-col sm:items-center justify-center text-center sm:py-8 py-14">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-5 sm:text-lg flex items-center gap-2 sm:-mt-12">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              ⚡ Fine-Grained Reactivity
            </span>
            <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
              🪶 Lightweight
            </span>
          </div>
          <h1 className="text-[1.80rem] leading-8 sm:px-8 md:leading-[4.5rem] font-bold mb-4 sm:text-6xl text-left sm:text-center">
            High-performance React state management with <span className="text-primary">fine-grained reactivity</span>
          </h1>
          <p className="mb-8 md:text-lg text-base max-w-[1200px] text-muted-foreground text-left sm:text-center">
            Mesa provides automatic dependency tracking and path-based subscriptions, ensuring only the components that
            need updates actually re-render. Zero dependencies, minimal bundle size, maximum performance.
          </p>
          <div className="sm:flex sm:flex-row grid grid-cols-2 items-center sm:gap-5 gap-3 mb-8">
            <Link href={`/docs${page_routes[0].href}`} className={buttonVariants({ className: "px-6", size: "lg" })}>
              Get Started
            </Link>
            <Link
              href="/docs/examples/counter"
              className={buttonVariants({
                variant: "secondary",
                className: "px-6",
                size: "lg",
              })}
            >
              View Examples
            </Link>
          </div>
          <span className="sm:flex hidden flex-row items-start sm:gap-2 gap-0.5 text-muted-foreground text-md mt-5 -mb-12 max-[800px]:mb-12 font-code sm:text-base text-sm font-medium">
            <TerminalSquareIcon className="w-5 h-5 sm:mr-1 mt-0.5" />
            {"npm install mesa"}
          </span>
        </div>

        {/* Feature highlights */}
        <div className="hidden sm:grid grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-2">Fine-Grained Updates</h3>
            <p className="text-sm text-muted-foreground">Only re-render components that use changed data</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-semibold mb-2">Simple API</h3>
            <p className="text-sm text-muted-foreground">Just two functions: proxy() and useStore()</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Zero Dependencies</h3>
            <p className="text-sm text-muted-foreground">~1KB gzipped with no external dependencies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
