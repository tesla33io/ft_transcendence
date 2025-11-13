import { FastifyInstance } from 'fastify';

export function setupGlobalErrorHandling(app: FastifyInstance) {
    // Catch any error that reaches Fastify’s error handler
    app.setErrorHandler((error, req, reply) => {
        const { method, url, id: requestId } = req;
        const userId = (req as any).session?.userId;

        // Check if this is a validation error
        const isValidationError = 
            error.validation || 
            error.code === 'FST_ERR_VALIDATION' ||
            error.code === 'FST_ERR_VALIDATION' ||
            (error.statusCode === 400 && (
                error.message?.includes('must be equal to one of the allowed values') ||
                error.message?.includes('must match') ||
                error.message?.includes('must be') ||
                error.message?.includes('Validation')
            ));
        
        if (isValidationError) {
            const statusCode = 400;
            app.log.warn(
                {
                    method,
                    url,
                    requestId,
                    userId,
                    validation: error.validation,
                    message: error.message,
                },
                `Validation error for ${method} ${url}`
            );
            
            return reply.status(statusCode).send({
                error: 'Validation error',
                details: error.validation || error.message,
            });
        }

        const statusCode = reply.statusCode || error.statusCode || 500;

        app.log.error(
            {
                err: error,
                method,
                url,
                requestId,
                userId,
                statusCode,
                hint: getErrorHint(error),
            },
            `Error while handling ${method} ${url}`
        );

        reply
        .status(statusCode >= 400 && statusCode < 600 ? statusCode : 500)
        .send({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development'
                ? error.message
                : 'An unexpected error occurred',
        });
    })

    // Optional: catch unhandled promise rejections globally
    process.on('unhandledRejection', (reason, promise) => {
        app.log.error({ reason }, 'Unhandled promise rejection');
    });

    process.on('uncaughtException', (err) => {
        app.log.fatal({ err }, 'Uncaught exception — shutting down');
        process.exit(1);
    });
}

function getErrorHint(err: any): string {
    if (!err) return 'Unknown error';
    if (err.validation) return 'Schema validation failed';
    if (err.code === 'FST_ERR_BAD_STATUS_CODE') return 'Invalid HTTP status code returned';
    if (err.code === 'FST_ERR_CTP_BODY_TOO_LARGE') return 'Request body too large';
    if (err.code === 'ENOENT') return 'File or directory not found';
    if (err.name === 'MongoError' || err.name === 'PrismaClientKnownRequestError') return 'Database query failed';
    return err.message || 'Generic application error';
}

