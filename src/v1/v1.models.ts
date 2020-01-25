export interface EncryptedKeyData {
  version: string;
  id: string;
  encryptedKey: string;
  iv: string;
  signature: string;
  salt: string;
}

export interface EncryptedDataChunk {
  iv: string;
  data: string[];
}
