import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads folder path
const uploadDir = path.join(__dirname, "../uploads");

// create uploads folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// upload route
router.post("/", upload.array("files"), (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = files.map((file) => ({
      fileName: file.originalname,
      url:`${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    res.status(200).json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "File upload failed",
    });
  }
});

export default router;