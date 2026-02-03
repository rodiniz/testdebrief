/* import { generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from "@azure/storage-blob";

export function getBlobSasUrl(
  accountName: string,
  accountKey: string,
  containerName: string,
  blobName: string,
  expiryMinutes = 15
): string {
  const sharedKey = new StorageSharedKeyCredential(accountName, accountKey);

  const now = new Date();
  const startsOn = new Date(now.valueOf() - 5 * 60 * 1000); // clock skew
  const expiresOn = new Date(now.valueOf() + expiryMinutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: "racwd", // read, add, create, write, delete permissions
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
    },
    sharedKey
  ).toString(); // creates the query string

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  return `${blobUrl}?${sas}`;
}
 */