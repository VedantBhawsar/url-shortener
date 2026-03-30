import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description:
        'Production-ready URL shortener API with analytics, rate limiting, and expiry support.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/your-repo',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.yourapp.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
      schemas: {
        ShortLink: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            originalUrl: { type: 'string', format: 'uri' },
            shortUrl: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            clicksCount: { type: 'integer', minimum: 0 },
            status: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            blockedRegions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: [
            'id',
            'originalUrl',
            'shortUrl',
            'userId',
            'clicksCount',
            'status',
            'createdAt',
            'updatedAt',
          ],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'createdAt', 'updatedAt'],
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
                latency: { type: 'number' },
              },
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
                latency: { type: 'number' },
              },
            },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  },
  apis: [
    './src/routes/authRoutes.ts',
    './src/routes/shortLinkRoutes.ts',
    './src/routes/userRoutes.ts',
    './src/routes/healthRoutes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
