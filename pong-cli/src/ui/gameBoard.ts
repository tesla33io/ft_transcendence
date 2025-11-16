import blessed from 'blessed';

export class GameBoard {
  private screen: blessed.Widgets.Screen;
  private gameBoard: blessed.Widgets.BoxElement;
  private gameWidth: number = 900;
  private gameHeight: number = 550;

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
      border: {
        type: 'line',  // Set type as 'line' for a simple border
      },
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
    this.screen.key(['q', 'C-c'], () => process.exit(0));
  }

  // Scale the coordinates to fit the terminal grid
  private scaleCoordinates(x: number, y: number): { scaledX: number, scaledY: number } {
    const scaledX = Math.round((x / this.gameWidth) * 80);  // Scale X to 80 columns
    const scaledY = Math.round((y / this.gameHeight) * 40); // Scale Y to 40 rows
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

    // Add the player and opponent info
    // this.gameBoard.setContent(`
    //   Player: ${player.name} (ID: ${player.id})
    //   Position: (${player.X}, ${player.Y})
    //   Score: ${player.score}

    //   Opponent: ${opponent.name} (ID: ${opponent.id})
    //   Position: (${opponent.X}, ${opponent.Y})
    //   Score: ${opponent.score}

    //   Ball Position: (${ball.x.toFixed(2)}, ${ball.y.toFixed(2)})
    //   Ball Velocity: (${ball.vx.toFixed(2)}, ${ball.vy.toFixed(2)})
    // `);

    // Create a grid to represent the game board with window border
    let grid = Array(40).fill('').map(() => Array(80).fill(' '));  // 40 rows, 80 columns

    // Draw the window border (this will be drawn around the grid)
    for (let row = 0; row < 40; row++) {
      for (let col = 0; col < 80; col++) {
        if (row === 0 || row === 39) {
          grid[row][col] = '-';  // Top and bottom borders
        } else if (col === 0 || col === 79) {
          grid[row][col] = '|';  // Left and right borders
        }
      }
    }

    // Place the player, opponent, and ball on the grid (inside the border)
    grid[playerPos.scaledY][playerPos.scaledX] = '@';  // Player's position
    grid[opponentPos.scaledY][opponentPos.scaledX] = '#';  // Opponent's position
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
}
