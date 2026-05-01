import { env } from "@/config/env";
import { connectDatabase, disconnectDatabase } from "@/config/database";
import { connectRedis, disconnectRedis } from "@/config/redis";
import { logger } from "@/config/logger";
import { app } from "@/app";

const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  try {
    await connectDatabase();
    logger.info("Database connected");
    await connectRedis();
    logger.info("Redis connected");
    logger.info(`GLAMO Nepal API running on port ${PORT} [${env.NODE_ENV}]`);
    logger.info(`API docs: http://localhost:${PORT}/api/v1/docs`);
  } catch (error) {
    logger.error("Failed to connect services:", error);
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info("All connections closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

export { server };