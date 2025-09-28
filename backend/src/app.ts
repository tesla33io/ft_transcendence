import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite'; // Import the SqliteDriver
import { User } from './entities/User.js';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

export { app };

const start = async () => {
    const orm = await MikroORM.init({
        entities: [User],
        dbName: 'database.sqlite',
        driver: SqliteDriver,
        // user: 'your_username',
        // password: 'your_password',
    });

    app.get('/', (req, res) => {
        res.send('Welcome to the ft_transcendence backend!');
    });

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});