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
