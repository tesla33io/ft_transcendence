# ft_transcendence-backend

## Project Overview
The ft_transcendence-backend project is a backend application built using TypeScript and MikroORM for database management. It is designed to handle user-related operations and provide a robust API for frontend integration.

## Technologies Used
- TypeScript
- MikroORM
- SQLite

## Project Structure
```
ft_transcendence-backend
├── src
│   ├── entities
│   │   └── User.ts
│   ├── migrations
│   │   └── README.md
│   ├── config
│   │   └── mikro-orm.config.ts
│   ├── app.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ft_transcendence-backend
   ```

2. **Install Dependencies**
   Make sure you have Node.js and npm installed. Then run:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and set up your database connection details:
   ```
   DB_TYPE=postgresql
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET='TRANS'
   ```

4. **Run Migrations**
   To create the necessary database tables, run:
   ```bash
   npm run migrate
   ```

5. **Start the Application**
   You can start the application using:
   ```bash
   npm start
   ```

## Usage Guidelines
- The API endpoints can be accessed at `http://localhost:3000`.
- Refer to the `src/migrations/README.md` for detailed instructions on managing database migrations.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.