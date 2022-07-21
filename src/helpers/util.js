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
export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(process.env.PASS_SALT);
  const hashPass = bcrypt.hashSync(password, salt);
  return hashPass;
};
export const unHashPassword = (password, hashedPass) => {
  return bcrypt.compareSync(password, hashedPass);
};
export const generatJWT = (userInfo) => {
  const token = jwt.sign(userInfo, process.env.SECRET, { expiresIn: "1w" });
  return token;
};
export const serverResponse = (
  res,
  statusCode,
  message,
  data,
  totalItems = 0
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

export const generateSlug = (title) => {
  const uniqueId = uniqid.process();
  const slug = `${slugify(title, { lower: true })}-${uniqueId}`;
  return slug;
};
export const paginator = ({ page, pageSize }) => {
  const limit = pageSize ? +pageSize : 20;
  const offset = page && +page !== 0 ? (+page - 1) * limit : 0;
  return { limit, offset };
};
export const authenticatedUser = async (req) => {
  const { user, useragent, headers } = req;
  if (
    useragent.isFirefox ||
    useragent.isOpera ||
    useragent.isChromeOS ||
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
  } else if ((useragent.browser = "PostmanRuntime" && req.isAuthenticated())) {
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
export const getLang = (req) => {
  return req.acceptsLanguages("en", "kn", "fr", "sw") || "en";
};
/**
 *
 * @param {Sting} word
 * @returns Word with first char capitalized
 */
export const ucFirst = (word) => {
  return word.replace(
    /(^\w|\s\w)(\S*)/g,
    (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
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

const setTwoDigit = (digit) => {
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

export const axiosYouTube = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  params: {
    part: "snippet",
    key: process.env.YOUTUBE_API_KEY,
  },
});
