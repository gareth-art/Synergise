import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardingRouter from "./onboarding";
import modelsRouter from "./models";
import accountsRouter from "./accounts";
import benchmarksRouter from "./benchmarks";
import adminRouter from "./admin";
import cfoInputsRouter from "./cfo-inputs";
import cfoMetricsRouter from "./cfo-metrics";
import unitEconomicsRouter from "./unit-economics";
import scenariosRouter from "./scenarios";
import aiRouter from "./ai";
import creditsRouter from "./credits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardingRouter);
router.use(modelsRouter);
router.use(accountsRouter);
router.use(benchmarksRouter);
router.use(adminRouter);
router.use(cfoInputsRouter);
router.use(cfoMetricsRouter);
router.use(unitEconomicsRouter);
router.use(scenariosRouter);
router.use(aiRouter);
router.use(creditsRouter);

export default router;
