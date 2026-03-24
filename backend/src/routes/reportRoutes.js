import { Router } from "express";
import { uploadReport } from "../controllers/reportController.js";
import { parseReportUpload } from "../middleware/multerReport.js";
import { protect } from "../middleware/authMiddleware.js";

const reportRoutes = Router();

reportRoutes.post("/upload", protect, parseReportUpload, uploadReport);

export default reportRoutes;
