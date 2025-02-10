import multer from "multer";
import { readdir, readdirSync, statSync, unlink } from "fs";
import {
  serverResponse,
  QueryHelper,
  uploadMany,
  uploadSingle,
  getPaginator,
  generateSlug,
  ucFirst,
} from "../helpers";
import {
  Album,
  Media,
  Topic,
  MediaDownload,
  MediaShare,
  Sequelize,
} from "../models";
import { ConstantHelper } from "../helpers/ConstantHelper";

const dbHelper = new QueryHelper(Album);
const dbMediaHelper = new QueryHelper(Media);
const dbTopicHelper = new QueryHelper(Topic);
const dbMediaDownloadHelper = new QueryHelper(MediaDownload);
const dbMediaShareHelper = new QueryHelper(MediaShare);
const constHelper = new ConstantHelper();
const { Op } = Sequelize;

export const createAlbum = async (req, res) => {
  const newAlbum = await dbHelper.create(req.body);
  return serverResponse(res, 201, "Success", newAlbum);
};

export const getAlbums = async (req, res) => {
  const albums = await dbHelper.findAll({ languageId: req.body.languageId });
  return serverResponse(res, 200, "Success", albums);
};

export const getOneAlbum = async (req, res) => {
  const { albumId: id } = req.params;
  const album = await dbHelper.findOne({ id });
  return serverResponse(res, 200, "Success", album);
};

export const editAlbumInfo = async (req, res) => {
  const { albumId: id } = req.params;
  await dbHelper.update(req.body, { id });
  return serverResponse(res, 200, "Album updated");
};

export const deleteAlbum = async (req, res) => {
  const { albumId: id } = req.params;
  await dbHelper.delete({ id });
  return serverResponse(res, 200, "Album deleted");
};

export const uploadFile = async (req, res) => {
  const { isMany, prevFile, update } = req.query;
  const { fileType } = req.params;
  const { IMAGES_ZONE, SONGS_ZONE } = process.env;

  const upload = isMany ? uploadMany : uploadSingle;

  const filePath = fileType === "image" ? IMAGES_ZONE : SONGS_ZONE;
  /**
   * Delete the previous file first then
   * Upload a new one
   */
  unlink(`${filePath}/${prevFile}`, error => {
    if (error) console.log("Error occurred, not deleted");

    upload(req, res, async uploadError => {
      if (uploadError instanceof multer.MulterError || uploadError) {
        return serverResponse(res, 500, uploadError);
      }
      if (!req.file) return serverResponse(res, 400, "No file selected");
      const fileName = req.file.filename;
      /**
       * Update a topic cover image if necessary
       */
      if (fileType === "image" && update !== "null") {
        await dbTopicHelper.update(
          { coverImage: fileName },
          { coverImage: prevFile },
        );
      }
      return serverResponse(res, 200, "File(s) uploaded", fileName);
    });
  });
};

export const deleteFile = (req, res) => {
  const { fileName, fileType } = req.params;
  const { IMAGES_ZONE, SONGS_ZONE } = process.env;
  const filePath = fileType === "image" ? IMAGES_ZONE : SONGS_ZONE;
  unlink(`${filePath}/${fileName}`, error => {
    if (error) return serverResponse(res, 500, "File not delete");
    return serverResponse(res, 200, "File deleted");
  });
};

export const addNewMedia = async (req, res) => {
  const { title } = req.body;
  req.body.slug = generateSlug(title);
  req.body.title = ucFirst(title);
  const newMedia = await dbMediaHelper.create(req.body);
  return serverResponse(res, 201, "Success", newMedia);
};

export const getMedia = async (req, res) => {
  const { mediaType } = req.params;
  let { search } = req.query;
  let conditions = mediaType !== "all" ? { type: mediaType } : {};
  if (mediaType !== "image") {
    conditions = { ...conditions, languageId: req.body.languageId };
  }
  if (search) {
    conditions = {
      ...conditions,
      [Op.or]: [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } },
      ],
    };
  }

  const { offset, limit } = getPaginator(req.query);
  let [rows, count] = await Promise.all([
    dbMediaHelper.findAll(
      conditions,
      constHelper.mediaIncludes(),
      [["actionDate", "DESC"]],
      undefined,
      offset,
      limit,
    ),
    dbMediaHelper.count({ where: conditions }),
  ]);

  const medias = rows
    .map(x => x.get({ plain: true }))
    .map(m => ({
      ...m,
      downloads: m.downloads.length,
      shares: m.shares.length,
    }));

  return serverResponse(res, 200, "Success", medias, count);
};

export const getAllMedia = async (req, res) => {
  const { mediaType } = req.params;
  let conditions = { type: mediaType };

  const { offset, limit } = getPaginator(req.query);
  let [rows, count] = await Promise.all([
    dbMediaHelper.findAll(
      conditions,
      constHelper.mediaIncludes(),
      [["actionDate", "DESC"]],
      undefined,
      offset,
      limit,
    ),
    dbMediaHelper.count({ where: conditions }),
  ]);

  const medias = rows
    .map(x => x.get({ plain: true }))
    .map(m => ({
      ...m,
      downloads: m.downloads.length,
      shares: m.shares.length,
    }));

  return serverResponse(res, 200, "Success", medias, count);
};

export const getMediaCounts = async (req, res) => {
  const downloads = await dbMediaDownloadHelper.count();
  const shares = await dbMediaShareHelper.count();

  return serverResponse(res, 200, "Success", { downloads, shares });
};

export const downloadSong = async (req, res) => {
  const { mediaId } = req.params;
  const media = await dbMediaHelper.findOne({ id: mediaId });
  if (!media) {
    return serverResponse(res, 400, `Song does not exist`);
  }
  if (media.type !== "audio") {
    return serverResponse(res, 400, `You can't download this file`);
  }
  const songsDir = process.env.SONGS_ZONE;
  readdir(songsDir, async (error, audios) => {
    if (error)
      return serverResponse(res, 503, `Sorry service not available. SDL`);
    if (audios.indexOf(media.mediaLink) === -1) {
      return serverResponse(res, 503, "The song does not exist");
    }
    await dbMediaDownloadHelper.create({ mediaId: media.id });
    return res.download(`${songsDir}/${media.mediaLink}`);
  });
};

export const deleteMedia = async (req, res) => {
  const { mediaId } = req.params;
  const media = await dbMediaHelper.findOne({ id: mediaId });
  const songLink = process.env.SONGS_ZONE + "/" + media.mediaLink;
  await dbMediaHelper.delete({ id: mediaId });

  unlink(songLink, error => {
    if (error) return serverResponse(res, 200, "File not delete");
    return serverResponse(res, 200, "File deleted");
  });
};

export const updateMedia = async (req, res) => {
  const { mediaId } = req.params;
  const { title } = req.body;
  if (req.body.title) {
    req.body.title = ucFirst(title);
    req.body.slug = generateSlug(title);
  }
  await dbMediaHelper.update(req.body, { id: mediaId });
  return serverResponse(res, 200, "Successfully updated");
};

export const shareMedia = async (req, res) => {
  const { mediaId } = req.params;

  await dbMediaShareHelper.create({ mediaId });
  return serverResponse(res, 200, "Success");
};

export const getPublicResources = async (req, res) => {
  let dir = process.env.IMAGES_ZONE;
  if (req.params.resourceType === "audio") {
    dir = process.env.SONGS_ZONE;
  }

  const resources = readdirSync(dir)
    .map(fileName => ({
      fileName,
      createdAt: statSync(`${dir}/${fileName}`).mtime.getTime(),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

  return serverResponse(res, 200, "Success", resources);
};

export const bulkCreateMedia = async (req, res) => {
  const result = { succeeded: 0, failed: 0 };

  for (let asset of req.body.assets) {
    if (asset.title && asset.languageId && asset.albumId) {
      asset.slug = generateSlug(asset.title);
      asset.title = ucFirst(asset.title);

      const newMedia = await dbMediaHelper.create(asset);
      console.log({ newMedia });

      result.succeeded += 1;
    } else {
      result.failed += 1;
    }
  }
  return serverResponse(res, 200, "Success", result);
};
