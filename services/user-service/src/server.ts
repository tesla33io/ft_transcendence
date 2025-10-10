import buildServer from './app';

(async () => {
    const app = await buildServer();
    app.listen({ port: 8000, host: '0.0.0.0' }, (err: any, address: any) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        console.log(`🚀 Server ready at ${address}`);
    });
});
