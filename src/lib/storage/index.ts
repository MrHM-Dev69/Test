import fs from "fs/promises";
import path from "path";
import { env } from "@/lib/env";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageDriver {
  /** Writes a private (non-web-accessible) file, returns its storage key. */
  putPrivateFile(key: string, data: Buffer, mimeType: string): Promise<string>;
  /** Reads a private file's bytes back out, for streaming through our own signed-download route. */
  getPrivateFile(key: string): Promise<Buffer>;
  deletePrivateFile(key: string): Promise<void>;
}

class LocalStorageDriver implements StorageDriver {
  // turbopackIgnore: this path is env-driven but always resolves under the
  // project root's storage/ directory; without the ignore comment, Turbopack's
  // static analysis traces the entire project as a potential dependency.
  private root = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.STORAGE_LOCAL_PRIVATE_DIR);

  private resolveSafe(key: string): string {
    // Path-traversal guard: reject any key that escapes the private root.
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async putPrivateFile(key: string, data: Buffer): Promise<string> {
    const fullPath = this.resolveSafe(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return key;
  }

  async getPrivateFile(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveSafe(key));
  }

  async deletePrivateFile(key: string): Promise<void> {
    await fs.rm(this.resolveSafe(key), { force: true });
  }
}

class S3StorageDriver implements StorageDriver {
  private client = new S3Client({
    endpoint: env.S3_ENDPOINT || undefined,
    region: env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: Boolean(env.S3_ENDPOINT),
  });

  async putPrivateFile(key: string, data: Buffer, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: mimeType,
        ACL: "private",
      }),
    );
    return key;
  }

  async getPrivateFile(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    );
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async deletePrivateFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }

  /** Direct presigned S3 URL — an alternative to proxying bytes through our own server for large files. */
  async getPresignedGetUrl(key: string, expiresInSeconds: number): Promise<string> {
    return getS3SignedUrl(this.client, new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}

export const storage: StorageDriver =
  env.STORAGE_DRIVER === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
