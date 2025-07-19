import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const commandsToSVGPath = (
  commands: readonly {
    readonly command: "moveTo" | "lineTo" | "quadraticCurveTo" | "bezierCurveTo" | "closePath";
    readonly args: readonly number[];
  }[]
) => {
  return commands
    .map((cmd) => {
      switch (cmd.command) {
        case "moveTo":
          return `M ${cmd.args[0]} ${cmd.args[1]}`;
        case "lineTo":
          return `L ${cmd.args[0]} ${cmd.args[1]}`;
        case "quadraticCurveTo":
          return `Q ${cmd.args[0]} ${cmd.args[1]} ${cmd.args[2]} ${cmd.args[3]}`;
        case "bezierCurveTo":
          return `C ${cmd.args[0]} ${cmd.args[1]} ${cmd.args[2]} ${cmd.args[3]} ${cmd.args[4]} ${cmd.args[5]}`;
        case "closePath":
          return "Z";
        default:
          return "";
      }
    })
    .join(" ");
};
