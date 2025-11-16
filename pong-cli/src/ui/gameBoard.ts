import blessed from 'blessed';


export class GameBoard {
  private screen: blessed.Widgets.Screen;
  private gameBoard: blessed.Widgets.BoxElement;
  private gameWidth: number = 900;
  private gameHeight: number = 550;
  private collum: number = 80;
  private row: number = 40;

  constructor() {
    // Initialize the screen and game board UI
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Pong Game',
    });

    // Create the game board with border
    this.gameBoard = blessed.box({
      top: 'center',
      left: 'center',
      width: this.gameWidth + 2,  // Add 2 for the border thickness
      height: this.gameHeight + 2,  // Add 2 for the border thickness
      border: "line",
      style: {
        border: {
          fg: 'green',  // Color of the border
        },
        fg: 'white',  // Color of the text
        bg: 'black',  // Background color of the terminal
      },
    });

    // Append the game board to the screen
    this.screen.append(this.gameBoard);

    // Exit on 'q' or 'Ctrl-C'
    this.screen.key(['q', 'C-c'], () =>{
        this.screen.destroy()
    });
    this.gameBoard.focus
    this.screen.on('resize', () => {
      this.screen.render();
    })
  }

  // Scale the coordinates to fit the terminal grid
  private scaleCoordinates(x: number, y: number): { scaledX: number, scaledY: number } {
    const scaledX = Math.round((x / this.gameWidth) * this.collum);  // Scale X to 80 columns
    const scaledY = Math.round((y / this.gameHeight) * this.row); // Scale Y to 40 rows
    return { scaledX, scaledY };
  }

  // Method to render the game state to the terminal
  public renderGameState(state: any) {
    const { player, opponent, ball } = state;

    // Clear the previous game state
    this.gameBoard.setContent('');

    // Scale positions for terminal rendering
    const playerPos = this.scaleCoordinates(player.X, player.Y);
    const opponentPos = this.scaleCoordinates(opponent.X, opponent.Y);
    const ballPos = this.scaleCoordinates(ball.x, ball.y);

    // Create a grid to represent the game board with window border
    let grid = Array(this.row).fill('').map(() => Array(this.collum).fill(' '));  // 40 rows, 80 columns

    // Draw the window border (this will be drawn around the grid)
    for (let row = 0; row < this.row; row++) {
      for (let col = 0; col < this.collum; col++) {
        if (row === 0 || row === this.row - 1) {
          grid[row][col] = '-';  // Top and bottom borders
        } else if (col === 0 || col === this.collum - 1) {
          grid[row][col] = '|';  // Left and right borders
        }
      }
    }

    // Place the player, opponent, and ball on the grid (inside the border)
    grid[playerPos.scaledY][playerPos.scaledX] = '|';  // Player's position
    grid[opponentPos.scaledY][opponentPos.scaledX] = '|';  // Opponent's position
    grid[ballPos.scaledY][ballPos.scaledX] = 'o';  // Ball's position

    // Create the visual representation of the grid
    let gridDisplay = grid.map(row => row.join('')).join('\n');

    // Add the grid to the content (with border)
    this.gameBoard.setContent(`
      ${this.gameBoard.getContent()}
      ${gridDisplay}
    `);

    // Render the updated game state
    this.screen.render();
  }

  public destroy(){
    this.screen.destroy()
  }
}
