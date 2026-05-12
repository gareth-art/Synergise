import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardingRouter from "./onboarding";
import modelsRouter from "./models";
import accountsRouter from "./accounts";
import benchmarksRouter from "./benchmarks";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardingRouter);
router.use(modelsRouter);
router.use(accountsRouter);
router.use(benchmarksRouter);
router.use(adminRouter);

export default router;
