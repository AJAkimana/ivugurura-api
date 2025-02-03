import axios from "axios";
import bcrypt from "bcrypt";
import slugify from "slugify";
import uniqid from "uniqid";
import path from "path";
import jwt, { verify } from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
// import nodemailer from 'nodemailer';
// import sgTransport from 'nodemailer-sendgrid-transport';
import { User } from "../models";
import { QueryHelper } from "./QueryHelper";
import { mailFormatter } from "./mailFormatter";

const dbUser = new QueryHelper(User);
export const hashPassword = password => {
  const salt = bcrypt.genSaltSync(process.env.PASS_SALT);
  const hashPass = bcrypt.hashSync(password, salt);
  return hashPass;
};
export const unHashPassword = (password, hashedPass) => {
  return bcrypt.compareSync(password, hashedPass);
};
export const generatJWT = userInfo => {
  const token = jwt.sign(userInfo, process.env.SECRET, { expiresIn: "1w" });
  return token;
};

/**
 *
 * @param {import ('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 * @param {number} totalItems
 * @returns {import('express').Response}
 */
export const serverResponse = (
  res,
  statusCode,
  message,
  data,
  totalItems = 0,
) => {
  const messageType = statusCode >= 400 ? "error" : "message";
  return res
    .status(statusCode)
    .json({ status: statusCode, [messageType]: message, data, totalItems });
};
export const joiValidatorMsg = (res, result) => {
  const errors = [];
  const errorsSent = result.error.details;

  for (let index = 0; index < errorsSent.length; index += 1) {
    errors.push(errorsSent[index].message.split('"').join(""));
  }
  return serverResponse(res, 400, errors[0]);
};

export const generateSlug = title => {
  const uniqueId = uniqid.process();
  const slug = `${slugify(title, { lower: true })}-${uniqueId}`;
  return slug;
};
export const getPaginator = ({ page, pageSize }) => {
  let pageNumber = 0;
  let rowsPerPage = 20;
  if (page && pageSize) {
    pageNumber = Number(page);
    rowsPerPage = Number(pageSize);
  }
  const limit = rowsPerPage;
  const offset = pageNumber > 1 ? (pageNumber - 1) * limit : 0;
  return { limit, offset };
};
export const authenticatedUser = async req => {
  const { user, useragent, headers } = req;
  if (
    useragent.isFirefox ||
    useragent.isOpera ||
    useragent.isChrome ||
    useragent.isEdge
  ) {
    const token = headers.authorization;
    try {
      const { id } = verify(token, process.env.SECRET);
      const user = await dbUser.findOne({ id });
      if (user.id) {
        return user;
      }
    } catch (error) {
      return null;
    }
  } else if (useragent.browser === "PostmanRuntime" && req.isAuthenticated()) {
    return user;
  }
  return null;
};
/**
 *
 * @param {String} subject The subject
 * @param {String} emailContent The formated message to be sent
 * @param {String} sendTo an email to send the message to
 */
export const sendEmail = async (subject, emailContent, sendTo) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const messageBody = {
    to: `${sendTo}`,
    from: `${process.env.APP_EMAIL}`,
    subject,
    html: emailContent,
    text: `${emailContent}`,
  };
  return await sgMail.send(messageBody);
};
export const getLang = req => {
  return req.acceptsLanguages("en", "kn", "fr", "sw") || "en";
};
/**
 *
 * @param {Sting} word
 * @returns Word with first char capitalized
 */
export const ucFirst = word => {
  return word.replace(
    /(^\w|\s\w)(\S*)/g,
    (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase(),
  );
};

/**
 * Roles
 */
export const systemRoles = { superAdmin: 1, admin: 2, editor: 3 };
/**
 *
 * @param {File} file File info
 * @param {String} filePath Where file will be saved
 * @param {Function} fileCallBack Callback function
 */
export const isFileAllowed = (file, filePath, fileCallBack) => {
  const images = process.env.IMAGES_ZONE;
  const audios = process.env.SONGS_ZONE;
  // Allowed exts
  const allowedImages = /jpeg|jpg|png/;
  const allowedAudios = /mp3|mpeg/;
  // Check ext
  let extname = false;
  // Check mime
  let mimetype = false;
  let errorMessage = "";
  if (filePath === images) {
    extname = allowedImages.test(path.extname(file.originalname).toLowerCase());
    mimetype = allowedImages.test(file.mimetype);
    errorMessage = "Error: only (jpeg, jpg or png) images allowed";
  }
  if (filePath === audios) {
    extname = allowedAudios.test(path.extname(file.originalname).toLowerCase());
    mimetype = allowedAudios.test(file.mimetype);
    errorMessage = "Error: only (mp3, mpeg) audio allowed";
  }

  if (mimetype && extname) {
    return fileCallBack(null, true);
  } else {
    fileCallBack(errorMessage);
  }
};
const MB = 1024 * 1024;
export const ACCEPTED_FILE_SIZE = 100 * MB; //100 mbs

const setTwoDigit = digit => {
  return digit <= 9 ? `0${digit}` : digit;
};
export const currentDate = () => {
  const date = new Date();
  let year = date.getFullYear();
  let month = setTwoDigit(date.getMonth() + 1);
  let day = setTwoDigit(date.getDate());
  let hour = setTwoDigit(date.getHours());
  let min = setTwoDigit(date.getMinutes());
  let sec = setTwoDigit(date.getSeconds());
  return `${year}-${month}-${day}-${hour}-${min}-${sec}`;
};

/**
 *
 * @param {String} title Description of the notifier
 * @param {String} info The notifier content
 */
export const notifyMe = async (title = "", info = "") => {
  try {
    const content = mailFormatter("System", "Reformation System", info);
    await sendEmail(title, content, process.env.ADMIN_EMAIL);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {*} error SequelizeError
 */
export const dbConnectFail = error => {
  const isDev = process.env.NODE_ENV === "develop";
  const isProduction = process.env.NODE_ENV === "production";
  if (isDev) {
    console.log("DB_Error", error);
    process.exit(1);
  }
  if (isProduction) {
    notifyMe("Something wrong with db", error.stack)
      .then(() => {
        console.log("Notified");
        process.exit(1);
      })
      .catch(err => {
        console.log("Not Notified", err.message);
        process.exit(1);
      });
  }
};

export const axiosYouTube = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  params: {
    part: "snippet",
    key: process.env.YOUTUBE_API_KEY,
  },
});

export const truncateString = (str, num = 8) => {
  // If the length of str is less than or equal to num
  // just return str--don't truncate it.
  if (str.length <= num) {
    return str;
  }
  // Return str truncated with '...' concatenated to the end of str.
  return str.slice(0, num) + "...";
};

export const getMimeType = filePath => {
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    // Add more as needed
  };
  // Extract the file extension
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();

  // Return the MIME type or undefined if not found
  return mimeTypes[ext] || "application/octet-stream"; // Default MIME type
};

export const getYtbChannelId = lang => {
  const ids = {
    kn: "UCCzVYqdLwgNMLMsP-NKNnIQ",
    en: "UCZe_Rjl4AGMtutq8UeQLuag",
    sw: "UCZe_Rjl4AGMtutq8UeQLuag",
    fr: "UCZe_Rjl4AGMtutq8UeQLuag",
  };

  return ids[lang] || ids.kn;
};
