import buildServer from './app';

(async () => {
    const app = await buildServer();
    app.listen({ host: "0.0.0.0", port: 8000 }, (err: any, address: any) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        console.log(`🚀 Server ready at ${address}`);
    });
});
