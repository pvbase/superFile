const azureStorage = require("azure-storage"),
  blobService = azureStorage.createBlobService(),
  getStream = require("into-stream"),
  containerName = "zenqore-supportings";

exports.uploadFiles = async function (req, res) {
  const blobName = getBlobName(req.file.originalname),
    stream = getStream(req.file.buffer),
    streamLength = req.file.buffer.length;
  /** Multer gives us file info in req.file object */
  if (!req.file) {
    res.status(404).json({ success: false, message: "Please upload File" });
    return;
  }
  /** Check the extension of the incoming file and
   *  use the appropriate module
   */
  // if (
  //   req.file.originalname.split(".")[
  //     req.file.originalname.split(".").length - 1
  //   ] === "xlsx"
  // ) {
  //   var data = [];
  //   xlsxFile(req.file.buffer).then((rows) => {
  //     for (i in rows) {
  //       for (j in rows[i]) {
  //         console.dir(rows[i][j]);
  //         data.push(rows[i][j]);
  //       }
  //     }

  //     res.status(200).json({ data: data });
  //   });
  // } else {
  //   exceltojson = xlstojson;
  // }

  // rows.forEach((col) => {
  //   col.forEach((data) => {
  //     console.log(data);
  //     console.log(typeof data);
  //   });
  // });
  // });

  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        res.status(400).json({ success: false, Error: err });
      } else {
        console.log();
        res.status(200).json({
          success: true,
          message: "Uploaded file successfully",
          data: {
            containerName: containerName,
            blobName: blobName,
            size: streamLength,
          },
        });
      }
    }
  );
};

exports.uploadAllImages = async function (req, res) {
  const blobName = getBlobName(req.file.originalname),
    stream = getStream(req.file.buffer),
    streamLength = req.file.buffer.length;
  /** Multer gives us file info in req.file object */
  if (!req.file) {
    res.status(404).json({ success: false, message: "Please upload File" });
    return;
  }
  /** Check the extension of the incoming file and
   *  use the appropriate module
   */
  // if (
  //   req.file.originalname.split(".")[
  //     req.file.originalname.split(".").length - 1
  //   ] === "xlsx"
  // ) {
  //   var data = [];
  //   xlsxFile(req.file.buffer).then((rows) => {
  //     for (i in rows) {
  //       for (j in rows[i]) {
  //         console.dir(rows[i][j]);
  //         data.push(rows[i][j]);
  //       }
  //     }

  //     res.status(200).json({ data: data });
  //   });
  // } else {
  //   exceltojson = xlstojson;
  // }

  // rows.forEach((col) => {
  //   col.forEach((data) => {
  //     console.log(data);
  //     console.log(typeof data);
  //   });
  // });
  // });

  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        res.status(400).json({ success: false, Error: err });
      } else {
        console.log();
        res.status(200).json({
          success: true,
          message: "Uploaded file successfully",
          data: {
            containerName: containerName,
            blobName: blobName,
            size: streamLength,
          },
        });
      }
    }
  );
};

exports.getFiles = async function (req, res) {};

exports.uploadToBlob = async function (file) {
  console.log("file", file.length);
  const blobName = getBlobName("receipts"),
    stream = getStream(file),
    streamLength = file.length;
  /** Multer gives us file info in req.file object */
  /** Check the extension of the incoming file and
   *  use the appropriate module
   */
  // if (
  //   req.file.originalname.split(".")[
  //     req.file.originalname.split(".").length - 1
  //   ] === "xlsx"
  // ) {
  //   var data = [];
  //   xlsxFile(req.file.buffer).then((rows) => {
  //     for (i in rows) {
  //       for (j in rows[i]) {
  //         console.dir(rows[i][j]);
  //         data.push(rows[i][j]);
  //       }
  //     }

  //     res.status(200).json({ data: data });
  //   });
  // } else {
  //   exceltojson = xlstojson;
  // }

  // rows.forEach((col) => {
  //   col.forEach((data) => {
  //     console.log(data);
  //     console.log(typeof data);
  //   });
  // });
  // });

  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        return err;
      } else {
        return {
          containerName: containerName,
          blobName: blobName,
        };
      }
    }
  );
};

const getBlobName = (originalName) => {
  const identifier = Math.random().toString().replace(/0\./, ""); // remove "0." from start of string
  return `${identifier}-${originalName}`;
};
