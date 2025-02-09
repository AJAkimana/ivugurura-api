import path from "path";
import { createReadStream, existsSync } from "fs";
import { QueryHelper, serverResponse } from "../helpers";
import { Book, BookCategory } from "../models";

const bookTb = new QueryHelper(Book);
const categoryTb = new QueryHelper(BookCategory);
/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const registerBook = async (req, res) => {
  const { title, author, description, categoryId } = req.body;

  const book = await bookTb.create({
    title,
    author,
    description,
    categoryId,
  });

  return serverResponse(res, 200, "Success", book);
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getBooks = async (req, res) => {
  const books = await bookTb.findAll();
  return serverResponse(res, 200, "Success", books);
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const getBookCategories = async (req, res) => {
  const categories = await categoryTb.findAll();
  return serverResponse(res, 200, "Success", categories);
};

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const readBook = async (req, res) => {
  const { bookId } = req.params;
  const book = await bookTb.findOne({ id: bookId });

  const filePath = path.join(__dirname, "pdfs", book?.url);
  if (!existsSync(filePath)) {
    return serverResponse(res, 404, "Book not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline"); // Inline view, no download
  res.setHeader("Cache-Control", "no-store");

  const fileStream = createReadStream(filePath);
  return fileStream.pipe(res);
};
