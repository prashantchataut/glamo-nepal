import { Router } from "express";
import { healthRoutes } from "./health.routes";

const router = Router();

const API_PREFIX = "/api/v1";

router.use(`${API_PREFIX}/health`, healthRoutes);

export { router as apiRoutes };