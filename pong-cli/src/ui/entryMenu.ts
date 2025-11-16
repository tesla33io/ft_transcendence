import * as blessed from "blessed";
import { clearConfig } from "../core/config";

export function entryMenu(): Promise<"login" | "register" | "exit"> {
  return new Promise((resolve) => {
    const screen = blessed.screen({
      smartCSR: true,
      title: "Pong CLI",
    });

    const box = blessed.box({
      top: "center",
      left: "center",
      width: "50%",
      height: "50%",
      border: { type: "line" },
      style: {
        border: { fg: "cyan" },
      },
      content: "Pong CLI\n\nSelect an option:",
      tags: true,
    });

    const menu = blessed.list({
      parent: box,
      top: 3,
      left: 2,
      width: "90%",
      height: "70%",
      keys: true,
      mouse: true,
      items: ["Login", "Register", "Exit"],
      style: {
        selected: { bg: "cyan", fg: "black" },
        item: { hoverBg: "cyan" }
      }
    });

    screen.append(box);
    menu.focus();
    screen.render();

    menu.on("select", (item, index) => {
      screen.destroy();

      if (index === 0) resolve("login");
      else if (index === 1) resolve("register");
      else resolve("exit");
    });

    screen.key(["escape", "q", "C-c"], () => {
      screen.destroy();
      clearConfig()
      resolve("exit");
    });
  });
}
