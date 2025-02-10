import { existsSync, mkdirSync, unlink } from "fs";
import multer from "multer";
import path from "path";
import { Topic } from "../models";
import { ConstantHelper } from "./ConstantHelper";
import { QueryHelper } from "./QueryHelper";
import { ACCEPTED_FILE_SIZE, isFileAllowed, serverResponse } from "./util";

const dbTopicHelper = new QueryHelper(Topic);
const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    let fileStorage = null;
    if (req.path.includes("upload/image")) {
      fileStorage = process.env.IMAGES_ZONE;
    } else if (req.path.includes("upload/song")) {
      fileStorage = process.env.SONGS_ZONE;
    } else callBack(ConstantHelper.serverError);
    callBack(null, fileStorage);
  },
  filename: (req, file, callBack) => {
    let ext = path.extname(file.originalname).split(".")[1];
    let fileName = file.originalname.split(".")[0];
    let mediaLink = `${fileName}-${Date.now()}.${ext}`;
    callBack(null, mediaLink);
  },
});

export const uploadSingle = multer({
  storage,
}).single("file");
export const uploadMany = multer({ storage }).array("file");

export const uploadSingleFile = async (req, res) => {
  let fileStorage = null;
  const { fileType } = req.params;
  const { prevFile, update } = req.query;
  if (fileType === "image") {
    fileStorage = process.env.IMAGES_ZONE;
  } else if (fileType === "song") {
    fileStorage = process.env.SONGS_ZONE;
  } else return serverResponse(res, 400, "Unknown file upload");
  /**
   * Delete the previous file if exist
   */
  if (!existsSync(fileStorage)) {
    mkdirSync(fileStorage, { recursive: true });
  }
  if (prevFile) {
    unlink(`${fileStorage}/${prevFile}`, () => {});
  }
  const diskStorage = multer.diskStorage({
    destination: (req, file, callBack) => {
      callBack(null, fileStorage);
    },
    filename: (req, file, callBack) => {
      let ext = path.extname(file.originalname).split(".")[1];
      let fileName = file.originalname.split(".")[0].replace(/\W/g, " ").trim();
      let mediaLink = `${fileName}-${Date.now()}.${ext}`;
      callBack(null, mediaLink);
    },
  });
  const upload = multer({
    storage: diskStorage,
    limits: { fileSize: ACCEPTED_FILE_SIZE },
    fileFilter: (req, file, filterCallBack) => {
      isFileAllowed(file, fileStorage, (error, allowed) => {
        if (error) return filterCallBack(error);
        return filterCallBack(null, allowed);
      });
    },
  }).single("file");

  return upload(req, res, async uploadError => {
    if (uploadError instanceof multer.MulterError || uploadError) {
      const errorMsg = uploadError.message || uploadError;
      return serverResponse(res, 500, errorMsg);
    }

    if (!req.file) return serverResponse(res, 400, "No file selected");
    const fileName = req.file.filename;
    if (fileType === "image" && update === "yes") {
      await dbTopicHelper.update(
        { coverImage: fileName },
        { coverImage: prevFile },
      );
    }
    return serverResponse(res, 200, "File(s) uploaded", fileName);
  });
};
