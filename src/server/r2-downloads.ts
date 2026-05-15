import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_SIGNED_URL_TTL_SECONDS = 10 * 60;

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function readR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2_CONFIG_MISSING");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function createInstallerSignedUrl({
  filePath,
  downloadName,
}: {
  filePath: string;
  downloadName: string;
}) {
  const config = readR2Config();
  const client = createR2Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: filePath,
    ResponseContentDisposition: `attachment; filename="${downloadName}"`,
  });

  return getSignedUrl(client, command, {
    expiresIn: R2_SIGNED_URL_TTL_SECONDS,
  });
}
