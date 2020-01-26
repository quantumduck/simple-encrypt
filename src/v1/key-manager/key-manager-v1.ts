import {
  cryptoModule,
  readModule,
  CryptoModuleInterface,
  ReadModuleInterface,
} from '../../singletons';
import { Dictionary } from '../../util';
import { KeyData } from '../v1.models';

export class KeyManagerV1 {
  readonly VERSION = 'v1';
  readonly ALG = 'aes-128-cbc';
  readonly KEY_LENGTH = 16;
  readonly IV_LENGTH = 16;
  readonly HASH_ALG = 'pbkdf2';
  readonly HASH_DIGEST = 'sha512';
  readonly ITER_COUNT = 1000;
  readonly SALT_LENGTH = 16;
  readonly ENCODING = 'base64';
  readonly MAX_RETRIES = 5;

  private keys: Dictionary<KeyData>;

  constructor(
    private consoleReader: ReadModuleInterface = readModule,
    private cryptoService: CryptoModuleInterface = cryptoModule
  ) {
    this.keys = {};
  }

  addKey(keyData: KeyData) {
    if (this.keys[keyData.id]) {
      throw Error(`Key ${keyData.id} already loaded`);
    }

    this.keys[keyData.id] = keyData;
  }

  getKey(keyId: string): KeyData {
    if (!this.keys[keyId]) {
      throw Error(`Key ${keyId} is not loaded`);
    }

    return this.keys[keyId];
  }

  lockKey(keyId: string) {
    const keyData = this.getKey(keyId);
    if (!keyData.decryptedKey) {
      return;
    }

    keyData.decryptedKey.fill(0);
    console.log(`Erasing key ${keyId}: ${keyData.decryptedKey}`);
    delete keyData.decryptedKey;
  }

  lockAllKeys() {
    Object.keys(this.keys).forEach(keyId => {
      this.lockKey(keyId);
    });
  }

  removeKey(keyId: string) {
    if (!this.keys[keyId]) {
      return;
    }

    this.lockKey(keyId);
    delete this.keys[keyId];
  }

  reset() {
    Object.keys(this.keys).forEach(keyId => {
      this.removeKey(keyId);
    });
  }

  async createNewKey(keyId: string) {
    if (this.keys[keyId]) {
      throw Error(`Key ${keyId} already exists`);
    }
    const key = await this.createRandomBuffer(this.KEY_LENGTH);
    this.keys[keyId] = await this.createKeyData(keyId, key);
  }

  async changeKeyPassword(keyId: string) {
    const key = await this.getDecryptedKey(keyId);
    const newKeyData = await this.createKeyData(keyId, key);
    this.keys[keyId] = newKeyData;
  }

  async getDecryptedKey(
    keyId: string,
    retries = this.MAX_RETRIES
  ): Promise<Buffer> {
    const keyData = this.getKey(keyId);
    if (keyData.decryptedKey) {
      return keyData.decryptedKey;
    }

    const password = await this.getPassword(
      `Enter password to decrypt key ${keyData.id} `
    );
    const salt = Buffer.from(keyData.salt, this.ENCODING);
    const hash = await this.getPasswordHash(
      password,
      salt,
      2 * this.KEY_LENGTH
    );
    const verify1 = Buffer.from(keyData.signature, this.ENCODING);
    const verify2 = hash.slice(this.KEY_LENGTH);
    if (!this.cryptoService.timingSafeEqual(verify1, verify2)) {
      console.error('Incorrect password');
      if (retries <= 0) {
        console.error('Max retries exceeded; exiting');
        process.exit(1);
      }
      return this.getDecryptedKey(keyId, retries - 1);
    }

    const iv = Buffer.from(keyData.iv, this.ENCODING);
    const decryptKey = hash.slice(0, this.KEY_LENGTH);
    const keyCipher = this.cryptoService.createDecipheriv(
      this.ALG,
      decryptKey,
      iv
    );

    const decryptedKey = keyCipher.update(keyData.encryptedKey, this.ENCODING);
    keyCipher.final();
    hash.fill(0);
    keyData.decryptedKey = decryptedKey;
    return decryptedKey;
  }

  private getPassword(promtText: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.consoleReader(
        { prompt: promtText, silent: true },
        (error, password) => {
          error ? reject(error) : resolve(password);
        }
      );
    });
  }

  private createRandomBuffer(length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.cryptoService.randomBytes(length, (error, bytes) => {
        error ? reject(error) : resolve(bytes);
      });
    });
  }

  private getPasswordHash(
    password: string,
    salt: Buffer,
    length: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.cryptoService.pbkdf2(
        password,
        salt,
        this.ITER_COUNT,
        length,
        this.HASH_DIGEST,
        (error, hash) => {
          error ? reject(error) : resolve(hash);
        }
      );
    });
  }

  private async createKeyData(keyId: string, key: Buffer): Promise<KeyData> {
    const password = await this.getPassword(
      `Enter password to encrypt key ${keyId}: `
    );
    const passwordVerify = await this.getPassword('Confirm password: ');
    if (password !== passwordVerify) {
      return this.createKeyData(keyId, key);
    }

    const iv = await this.createRandomBuffer(this.IV_LENGTH);
    const salt = await this.createRandomBuffer(this.SALT_LENGTH);
    const hash = await this.getPasswordHash(
      password,
      salt,
      2 * this.KEY_LENGTH
    );
    const tempKey = hash.slice(0, this.KEY_LENGTH);
    const signature = hash.slice(this.KEY_LENGTH).toString(this.ENCODING);
    const keyCipher = this.cryptoService.createCipheriv(this.ALG, tempKey, iv);
    const encryptedKey =
      keyCipher.update(key, undefined, this.ENCODING) +
      keyCipher.final(this.ENCODING);
    hash.fill(0);

    return {
      version: this.VERSION,
      id: keyId,
      encryptedKey,
      signature,
      iv: iv.toString(this.ENCODING),
      salt: salt.toString(this.ENCODING),
      decryptedKey: key,
    };
  }
}
