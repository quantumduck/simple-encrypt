import { Cipher, Decipher } from 'crypto';
import { Options } from 'read';

export interface CryptoModuleInterface {
  timingSafeEqual(buff1: Buffer, buff2: Buffer): boolean;
  createCipheriv(algorithm: string, key: Buffer, iv: Buffer): Cipher;
  createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): Decipher;
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

export type ReadModuleInterface = (
  options: Options,
  callback: (error: null | Error, result: string, isDefault: boolean) => void
) => void;
