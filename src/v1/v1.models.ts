export interface KeyData {
  version: string;
  id: string;
  encryptedKey: string;
  iv: string;
  signature: string;
  salt: string;
  decryptedKey?: Buffer;
}

export interface EncryptedDataChunk {
  iv: string;
  data: string[];
}
