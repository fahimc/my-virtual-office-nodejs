import { createHash, createHmac } from 'node:crypto';
import type { StorageProvider, StoredObject } from './storageProvider.js';

export class MinioStorageProvider implements StorageProvider {
  readonly name = 'minio' as const;

  constructor(
    private readonly config = minioConfigFromEnv()
  ) {}

  async put(input: { projectId: string; filename: string; content: Buffer; mimeType: string }): Promise<StoredObject> {
    assertConfigured(this.config);
    const key = `${safeSegment(input.projectId)}/${Date.now()}-${safeSegment(input.filename)}`;
    const url = objectUrl(this.config, key);
    const headers = signedHeaders({
      method: 'PUT',
      url,
      payload: input.content,
      contentType: input.mimeType,
      config: this.config
    });
    const response = await fetch(url, { method: 'PUT', headers, body: new Uint8Array(input.content) });
    if (!response.ok) throw new Error(`MinIO upload failed: ${response.status} ${await response.text()}`);
    return {
      storageProvider: this.name,
      storagePath: key,
      publicUrl: this.config.publicUrl ? `${this.config.publicUrl.replace(/\/$/, '')}/${key}` : undefined
    };
  }

  async delete(storagePath: string): Promise<void> {
    assertConfigured(this.config);
    const url = objectUrl(this.config, storagePath);
    const headers = signedHeaders({
      method: 'DELETE',
      url,
      payload: Buffer.alloc(0),
      contentType: 'application/octet-stream',
      config: this.config
    });
    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok && response.status !== 404) throw new Error(`MinIO delete failed: ${response.status} ${await response.text()}`);
  }
}

interface MinioConfig {
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region: string;
  publicUrl?: string;
}

export function minioConfigured(): boolean {
  const config = minioConfigFromEnv();
  return Boolean(config.endpoint && config.bucket && config.accessKey && config.secretKey);
}

function minioConfigFromEnv(): MinioConfig {
  return {
    endpoint: process.env.MINIO_ENDPOINT,
    bucket: process.env.MINIO_BUCKET,
    accessKey: process.env.MINIO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.MINIO_REGION || process.env.AWS_REGION || 'us-east-1',
    publicUrl: process.env.MINIO_PUBLIC_URL
  };
}

function assertConfigured(config: MinioConfig): asserts config is Required<Pick<MinioConfig, 'endpoint' | 'bucket' | 'accessKey' | 'secretKey' | 'region'>> & MinioConfig {
  if (!config.endpoint || !config.bucket || !config.accessKey || !config.secretKey) {
    throw new Error('MinIO storage requires MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY.');
  }
}

function objectUrl(config: MinioConfig, key: string): string {
  assertConfigured(config);
  const endpoint = config.endpoint.replace(/\/$/, '');
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${endpoint}/${encodeURIComponent(config.bucket)}/${encodedKey}`;
}

function signedHeaders(input: { method: string; url: string; payload: Buffer; contentType: string; config: MinioConfig }): Record<string, string> {
  assertConfigured(input.config);
  const target = new URL(input.url);
  const now = new Date();
  const amzDate = isoAmz(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(input.payload);
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${target.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join('\n') + '\n';
  const signedHeaderNames = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    input.method,
    target.pathname,
    target.searchParams.toString(),
    canonicalHeaders,
    signedHeaderNames,
    payloadHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${input.config.region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(Buffer.from(canonicalRequest))].join('\n');
  const signature = hmacHex(signingKey(input.config.secretKey, dateStamp, input.config.region), stringToSign);
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${input.config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
    'content-type': input.contentType,
    host: target.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
}

function signingKey(secret: string, dateStamp: string, region: string): Buffer {
  const dateKey = hmacBuffer(`AWS4${secret}`, dateStamp);
  const dateRegionKey = hmacBuffer(dateKey, region);
  const dateRegionServiceKey = hmacBuffer(dateRegionKey, 's3');
  return hmacBuffer(dateRegionServiceKey, 'aws4_request');
}

function hmacBuffer(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: string | Buffer, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

function sha256Hex(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function isoAmz(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function safeSegment(value: string): string {
  return value.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}
