import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadDir = path.join(__dirname, "../../uploads/reports");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_BYTES = 15 * 1024 * 1024;

const allowedMimes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX"
        )
      );
    }
  },
});

export const parseReportUpload = (req, res, next) => {
  uploader.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "File too large (max 15MB)"
            : err.message;
        return res.status(400).json({ message });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};
