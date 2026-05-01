import express from "express";
import { requestLogger } from "@/middleware/requestLogger.middleware";
import { applySecurityMiddleware } from "@/middleware/security.middleware";
import { errorHandler } from "@/middleware/error.middleware";
import { notFoundHandler } from "@/middleware/notFound.middleware";
import { apiRoutes } from "@/routes";
import { swaggerUi, swaggerSpec } from "@/docs/swagger";

const app = express();

applySecurityMiddleware(app);

app.use(requestLogger);

app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(apiRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };