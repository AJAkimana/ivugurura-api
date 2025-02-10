import { Router } from "express";
import userRoutes from "./userRoutes";
import topicRoutes from "./topicRoutes";
import categoryRoutes from "./categoryRoutes";
import albumRoutes from "./albumRoutes";
import announceRoutes from "./announceRoutes";
import manageRoutes from "./manageRoutes";
import { getLang } from "../../helpers";
import { translate } from "../../locales";
import bookRoutes from "../../books/routes";

const apiRoutes = Router();

apiRoutes.get("/", (req, res) => {
  const lang = getLang(req);
  res.status(200).json({ message: `${translate[lang].welcomeMesg}: V1` });
});
apiRoutes.use("/users", userRoutes);
apiRoutes.use("/topics", topicRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/albums", albumRoutes);
apiRoutes.use("/announcements", announceRoutes);
apiRoutes.use("/manage", manageRoutes);
apiRoutes.use("/books", bookRoutes);

export default apiRoutes;
