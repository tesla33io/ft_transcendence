// src/devConsole.ts

export class DevConsole {
  private container: HTMLDivElement;
  private output: HTMLDivElement;
  private toggleBtn: HTMLButtonElement;

  constructor() {
    // overall container: column layout so header stays on top and output scrolls
    this.container = document.createElement("div");
    this.container.id = "dev-console";
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 150px;        /* maximum height when open */
      display: flex;
      flex-direction: column;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      border-top: 1px solid rgba(255,255,255,0.03);
      box-shadow: 0 -4px 12px rgba(0,0,0,0.6);
    `;

    // header (title + toggle button)
    const header = document.createElement("div");
    header.style.cssText = `
      display:flex;
      align-items:center;
      gap:8px;
      padding:6px 8px;
      background: rgba(0,0,0,0.95);
      color: #fff;
      user-select: none;
    `;
    const title = document.createElement("div");
    title.textContent = "Dev Console";
    title.style.fontWeight = "600";

    // toggle button (Hide / Show)
    this.toggleBtn = document.createElement("button");
    this.toggleBtn.type = "button";
    this.toggleBtn.textContent = "Hide";
    this.toggleBtn.style.cssText = `
      margin-left: auto;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.08);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;

    // clicking the button toggles the output visibility and shrinks container
    this.toggleBtn.addEventListener("click", () => {
      const hidden = this.output.style.display === "none";
      if (hidden) {
        // show output
        this.output.style.display = "block";
        this.toggleBtn.textContent = "Hide";
        this.container.style.maxHeight = "200px";
        // scroll to bottom when reopening
        this.output.scrollTop = this.output.scrollHeight;
      } else {
        // hide output (keep header visible)
        this.output.style.display = "none";
        this.toggleBtn.textContent = "Show";
        // shrink container so only header is visible
        this.container.style.maxHeight = "40px";
      }
    });

    header.appendChild(title);
    header.appendChild(this.toggleBtn);
    this.container.appendChild(header);

    // output area: this is the scrollable region
    this.output = document.createElement("div");
    this.output.style.cssText = `
      flex: 1;                /* take remaining space */
      overflow-y: auto;       /* enable vertical scrolling */
      padding: 6px 8px;
      line-height: 1.3;
      white-space: pre-wrap;
    `;
    this.container.appendChild(this.output);

    document.body.appendChild(this.container);

    this.patchConsole();
  }

  private patchConsole() {
    const origLog = console.log;
    const origError = console.error;
    const origWarn = console.warn;

    console.log = (...args: any[]) => {
      origLog(...args);
      this.print("LOG", args);
    };

    console.error = (...args: any[]) => {
      origError(...args);
      this.print("ERROR", args, "red");
    };

    console.warn = (...args: any[]) => {
      origWarn(...args);
      this.print("WARN", args, "orange");
    };
  }

  private print(type: string, args: any[], color = "lime") {
    const msg = document.createElement("div");
    msg.style.color = color;
    msg.textContent = `[${type}] ${args
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ")}`;

    this.output.appendChild(msg);

    // auto-scroll only if output is visible
    if (this.output.style.display !== "none") {
      this.output.scrollTop = this.output.scrollHeight;
    }
  }
}
