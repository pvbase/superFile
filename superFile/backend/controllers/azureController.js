const { BlobServiceClient } = require("@azure/storage-blob");

exports.getBlobData = async function (containerName, blobName) {
  // Create the BlobServiceClient object which will be used to create a container client
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  // Get a block blob client
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  var blo = blockBlobClient.url;
  console.log("block", blockBlobClient.url);
  return blo;
};

// A helper method used to read a Node.js readable stream into a string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}
