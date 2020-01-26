import * as crypto from 'crypto';
import * as read from 'read';
import { KeyManagerV1 } from './v1';

export const cryptoModule: CryptoModuleInterface = crypto;
export interface CryptoModuleInterface {
  timingSafeEqual(buff1: Buffer, buff2: Buffer): boolean;
  createCipheriv(algorithm: string, key: Buffer, iv: Buffer): crypto.Cipher;
  createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): crypto.Decipher;
  randomBytes(
    size: number,
    callback: (err: null | Error, bytes: Buffer) => void
  ): void;
  pbkdf2(
    password: string,
    salt: Buffer,
    iterations: number,
    keylen: number,
    digest: string,
    callback: (err: null | Error, derivedKey: Buffer) => void
  ): void;
}

export const readModule: ReadModuleInterface = read;
export type ReadModuleInterface = (
  options: read.Options,
  callback: (error: null | Error, result: string, isDefault: boolean) => void
) => void;
