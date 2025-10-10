# MikroORM Migrations Documentation

This README provides guidance on how to create and apply database migrations using MikroORM in the ft_transcendence backend project.

## Creating Migrations

To create a new migration, use the MikroORM CLI. Run the following command in your terminal:

```
npx mikro-orm migration:create
```

This command will generate a new migration file in the `migrations` directory. You can specify a name for the migration by adding the `--name` flag:

```
npx mikro-orm migration:create --name YourMigrationName
```

## Applying Migrations

To apply the migrations to your database, use the following command:

```
npx mikro-orm migration:up
```

This will execute all pending migrations in the order they were created.

## Reverting Migrations

If you need to revert the last applied migration, you can use:

```
npx mikro-orm migration:down
```

This command will roll back the most recent migration.

## Migration Files

Migration files are located in the `migrations` directory. Each migration file contains the necessary code to update the database schema. Ensure to review and test your migrations before applying them to production.

## Additional Resources

For more detailed information on MikroORM migrations, refer to the [MikroORM documentation](https://mikro-orm.io/docs/migrations).