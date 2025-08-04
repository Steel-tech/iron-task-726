const fastify = require('fastify')({ logger: false });

fastify.get('/test', async (request, reply) => {
  return { message: 'Server is working!' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '127.0.0.1' });
  } catch (err) {
    process.exit(1);
  }
};

start();