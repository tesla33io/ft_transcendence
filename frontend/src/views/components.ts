interface WindowOptions {
    title: string;
    width?: string;
    height?: string;
    content?: HTMLElement;
    initialPosition?: { x: number; y: number };
    titleBarControls?: {
        minimize?: boolean;
        maximize?: boolean;
        close?: boolean;
        help?: boolean;
        onMinimize?: () => void;
        onMaximize?: () => void;
        onClose?: () => void;
        onHelp?: () => void;
    };
    isMaximized?: boolean;
}

export function createWindow(options: WindowOptions): HTMLElement {
    const windowDiv = document.createElement("div");
    windowDiv.className = "window";
    if (options.width) windowDiv.style.width = options.width;
    if (options.height) windowDiv.style.height = options.height;

    // Position setup
    windowDiv.style.position = "absolute";
    windowDiv.style.left = `${options.initialPosition?.x || 50}px`;
    windowDiv.style.top = `${options.initialPosition?.y || 50}px`;

    // Title bar
    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";

    const titleBarText = document.createElement("div");
    titleBarText.className = "title-bar-text";
    titleBarText.textContent = options.title;

    const titleBarControls = document.createElement("div");
    titleBarControls.className = "title-bar-controls";

    // Add controls based on options
    if (options.titleBarControls) {
        if (options.titleBarControls.minimize) {
            const btnMin = document.createElement("button");
            btnMin.setAttribute("aria-label", "Minimize");
            btnMin.onclick = options.titleBarControls.onMinimize || (() => {});
            titleBarControls.appendChild(btnMin);
        }

        if (options.titleBarControls.maximize) {
            const btnMax = document.createElement("button");
            btnMax.setAttribute("aria-label", options.isMaximized ? "Restore" : "Maximize");
            btnMax.onclick = options.titleBarControls.onMaximize || (() => {});
            titleBarControls.appendChild(btnMax);
        }

        if (options.titleBarControls.help) {
            const btnHelp = document.createElement("button");
            btnHelp.setAttribute("aria-label", "Help");
            btnHelp.onclick = options.titleBarControls.onHelp || (() => {});
            titleBarControls.appendChild(btnHelp);
        }

        if (options.titleBarControls.close) {
            const btnClose = document.createElement("button");
            btnClose.setAttribute("aria-label", "Close");
            btnClose.onclick = () => {
                if (options.titleBarControls?.onClose) {
                    options.titleBarControls.onClose();
                }
                windowDiv.remove();
            };
            titleBarControls.appendChild(btnClose);
        }
		titleBar.appendChild(titleBarText);
		titleBar.appendChild(titleBarControls);
    }


    // Create window body
    const windowBody = document.createElement("div");
    windowBody.className = "window-body";

    // Add content if provided
    if (options.content) {
        windowBody.appendChild(options.content);
    }

    // Make window draggable
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    titleBar.addEventListener("mousedown", (e) => {
        isDragging = true;
        initialX = e.clientX - windowDiv.offsetLeft;
        initialY = e.clientY - windowDiv.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            windowDiv.style.left = `${currentX}px`;
            windowDiv.style.top = `${currentY}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Assemble window
    windowDiv.append(titleBar, windowBody);

    return windowDiv;
}


//match history coponent
// Type Definitions
// -------------------------------

// Define a single match entry
export interface Match {
  opponent: string;
  result: 'Win' | 'Lose';
  value: string; // Placeholder for any additional info
}

// -------------------------------
// MatchHistory Component
// -------------------------------

export class MatchHistory {
  container: HTMLElement;
  table: HTMLTableElement;
  data: Match[];
  maxVisible: number;
  showAll: boolean;
  showMoreButton: HTMLButtonElement;

  constructor(containerId: string, data: Match[], maxVisible: number = 5) {
    this.container = document.getElementById(containerId)!;
    this.data = data;
    this.maxVisible = maxVisible;
    this.showAll = false;

    // Create table
    this.table = document.createElement('table');
    this.table.className = 'interactive';

    // Show More button
    this.showMoreButton = document.createElement('button');
    this.showMoreButton.textContent = 'Show More';
    this.showMoreButton.style.marginTop = '5px';
    this.showMoreButton.addEventListener('click', () => this.toggleShowAll());

    this.renderTable();
    this.attachEvents();
    this.container.appendChild(this.table);

    // Only show button if there are more rows than maxVisible
    if (this.data.length > this.maxVisible) {
      this.container.appendChild(this.showMoreButton);
    }
  }

  // Render table headers and rows
  renderTable() {
    this.table.innerHTML = '';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Opponent', 'Result', 'Value'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    this.table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rowsToShow = this.showAll ? this.data : this.data.slice(0, this.maxVisible);

    rowsToShow.forEach(match => {
      const row = document.createElement('tr');

      const opponentCell = document.createElement('td');
      opponentCell.textContent = match.opponent;
      row.appendChild(opponentCell);

      const resultCell = document.createElement('td');
      resultCell.textContent = match.result;
      row.appendChild(resultCell);

      const valueCell = document.createElement('td');
      valueCell.textContent = match.value;
      row.appendChild(valueCell);

      tbody.appendChild(row);
    });

    this.table.appendChild(tbody);
  }

  // Highlight clicked row
  attachEvents() {
    this.table.addEventListener('click', (event) => {
      const highlightedClass = 'highlighted';
      const targetRow = (event.target as HTMLElement).closest('tr');
      if (!targetRow || targetRow.parentElement!.tagName !== 'TBODY') return;

      const prevSelected = Array.from(targetRow.parentElement!.children)
        .find(el => el.classList.contains(highlightedClass));
      if (prevSelected) prevSelected.classList.remove(highlightedClass);

      targetRow.classList.toggle(highlightedClass);
    });
  }

  // Toggle show all / collapse
  toggleShowAll() {
    this.showAll = !this.showAll;
    this.renderTable();
    this.showMoreButton.textContent = this.showAll ? 'Show Less' : 'Show More';
  }
}


//stats component 
export interface StatsData{
    wins: number,
    losses: number,
    tournamentsWon: number,
    elo: number,
    eloHistory: {date: string, elo:number }[];
}


export class Stats {
  container: HTMLElement;
  data: StatsData;

  constructor(container: HTMLElement, data: StatsData) {
    this.container = container;
    this.data = data;

    this.render();
  }

  render() {
    this.container.innerHTML = "";

    // 1️⃣ Numeric stats panels
    const panels = document.createElement("div");
    panels.style.display = "flex";
    panels.style.gap = "40px";

    const winPanel = this.createPanel("Wins", this.data.wins);
    const lossPanel = this.createPanel("Losses", this.data.losses);
    const tournamentPanel = this.createPanel("Tournaments Won", this.data.tournamentsWon);
    const eloPanel = this.createPanel("Elo", this.data.elo);

    panels.append(winPanel, lossPanel, tournamentPanel, eloPanel);
    this.container.appendChild(panels);

    // 2️⃣ Win/Loss pie chart
    const pieCanvas = document.createElement("canvas");
    pieCanvas.width = 200;
    pieCanvas.height = 200;
    const pieHeader = document.createElement("h4");
    pieHeader.textContent = "Win/Lose Ratio"
    this.container.appendChild(pieHeader);
    this.container.appendChild(pieCanvas);
    this.drawWinLossPie(pieCanvas);

    // 3️⃣ Elo over time graph
    const graphCanvas = document.createElement("canvas");
    graphCanvas.width = 200;
    graphCanvas.height = 100;
    graphCanvas.style.marginTop = "10px";
    this.container.appendChild(graphCanvas);
    this.drawEloGraph(graphCanvas);
  }

  createPanel(title: string, value: number): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "sunken-panel";
    panel.style.padding = "10px";
    panel.style.textAlign = "center";

    const t = document.createElement("div");
    t.textContent = title;
    t.style.fontWeight = "bold";

    const v = document.createElement("div");
    v.textContent = value.toString();

    panel.append(t, v);
    return panel;
  }

  drawWinLossPie(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    const total = this.data.wins + this.data.losses;
    const winAngle = (this.data.wins / total) * 2 * Math.PI;

    // Draw wins slice
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.arc(100, 100, 100, 0, winAngle);
    ctx.closePath();
    ctx.fill();

    // Draw losses slice
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.arc(100, 100, 100, winAngle, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    // Optional: draw outline
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

  drawEloGraph(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    const padding = 20;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const history = this.data.eloHistory;
    if (history.length < 2) return;

    const eloValues = history.map(h => h.elo);
    const minElo = Math.min(...eloValues);
    const maxElo = Math.max(...eloValues);

    const xStep = width / (history.length - 1);

    // Draw axes
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + height);
    ctx.lineTo(padding + width, padding + height);
    ctx.stroke();

    // Draw Elo polyline
    ctx.strokeStyle = "green";
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = padding + i * xStep;
      const y = padding + height - ((h.elo - minElo) / (maxElo - minElo)) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}


import start from './images/windows-0.png'
import volumepic from './images/loudspeaker.png';
import networkPic from './images/gps.png';

//task bar 
interface TaskbarOptions {
  startButton?: {
    label: string;
    onClick: () => void;
  };
  tasks?: { id: string; label: string; onClick: () => void }[];
  systemTrayIcons?: { id: string; icon: string; onClick: () => void }[];
  clock?: boolean; // Whether to show the clock
}

export function createTaskbar(options: TaskbarOptions): { taskbar: HTMLElement; taskArea: HTMLElement } {
  // Create the taskbar container
  const taskbar = document.createElement("div");
  taskbar.className = "taskbar fixed bottom-0 left-0 w-full h-12 flex items-center bg-silver border-t-2 border-color#e7e9e6";
  taskbar.style.backgroundColor = '#b6bbb7'; // Windows 98 silver color
  taskbar.style.borderColor = '#e7e9e6'
  taskbar.style.borderTop = '4px sold #e7e9e6'
  // Start Button
  if (options.startButton) {
    const startButton = document.createElement("div");
    startButton.className = "start-button flex items-center px-4 py-2 bg-win98-button text-win98-text cursor-pointer hover:bg-gray-600";
    startButton.style.border = "2px solid #a5a9a6"; // Outer border
    startButton.style.boxShadow = "inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080"; // 3D effect
    startButton.style.padding = "4px 8px"; // Add padding for spacing
    startButton.style.margin = "4px"; // Add spacing around the button
    startButton.innerHTML = `
      <img src="${start}" alt="Start" class="w-6 h-6 mr-2">
      <span>${options.startButton.label}</span>
    `;
    startButton.addEventListener("click", options.startButton.onClick);
    taskbar.appendChild(startButton);
  }

  // Task Area (Dynamic Content)
  const taskArea = document.createElement("div");
  taskArea.className = "task-area flex-1 flex items-center px-4 space-x-4";
  taskbar.appendChild(taskArea);

  // System Tray (Fixed Content)
  const systemTray = document.createElement("div");
  systemTray.className = "system-tray flex items-center space-x-4 px-4";
  systemTray.style.border = "2px solid #a5a9a6"; // Outer border
  systemTray.style.boxShadow = "inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080"; // 3D effect
  systemTray.style.padding = "4px"; // Add padding for spacing
  systemTray.style.marginLeft = "auto"; // Push the system tray to the right

  // Volume Icon
  const volumeIcon = document.createElement("img");
  volumeIcon.className = "tray-icon w-4 h-4";
  volumeIcon.src = volumepic;
  volumeIcon.style.backgroundSize = "cover";
  volumeIcon.addEventListener("click", () => alert("Volume Clicked!"));
  systemTray.appendChild(volumeIcon);

  // Network Icon
  const networkIcon = document.createElement("img");
  networkIcon.className = "tray-icon w-8 h-8";
  networkIcon.src = networkPic;
  networkIcon.style.backgroundSize = "cover";
  networkIcon.addEventListener("click", () => alert("Network Clicked!"));
  systemTray.appendChild(networkIcon);

  // Clock
  if (options.clock) {
    const clock = document.createElement("div");
    clock.className = "clock text-black";
    clock.style.marginLeft = "8px"; // Add spacing between icons and clock
    systemTray.appendChild(clock);

    // Update the clock dynamically
    function updateClock() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      clock.textContent = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }
    setInterval(updateClock, 1000);
    updateClock();
  }

  taskbar.appendChild(systemTray);

  // Return the taskbar and task area for dynamic updates
  return { taskbar, taskArea };
}


