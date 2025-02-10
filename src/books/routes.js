import { Router } from "express";
import { catchErrors } from "../middlewares";
import { getBookCategories, getBooks, readBook } from "./controllers";

const bookRoutes = Router();

bookRoutes.get("/", catchErrors(getBooks));
bookRoutes.get("/categories", catchErrors(getBookCategories));
bookRoutes.get("/:id", catchErrors(readBook));

export default bookRoutes;
