import { timingSafeEqual } from 'crypto';
import { KeyManagerV1 } from '..';
import { KeyData } from '../v1.models';
import { cryptoModule } from '../../singletons';

describe('KeyManagerV1', () => {
  let target: KeyManagerV1;
  const VERSION = 'v1';
  const ALG = 'aes-128-cbc';
  const KEY_LENGTH = 16;
  const IV_LENGTH = 16;
  const HASH_ALG = 'pbkdf2';
  const HASH_DIGEST = 'sha512';
  const ITER_COUNT = 1000;
  const SALT_LENGTH = 16;
  const ENCODING = 'base64';
  const MAX_RETRIES = 5;

  const exampleKeyId = 'new1';
  const mockPassword = 'swordfish';
  const mockKeyString = 'SECRETKEY1234567';
  const mockEncryptedKeyString = '7654321YEKTERCES';
  const mockIvString = 'IVIVIVIVIVIVIVIV';
  const mockSaltString = 'SALTSALTSALTSALT';
  const mockTempKeyString = 'TEMPKEY__TEMPKEY';
  const mockSignatureString = 'SIGNATURE1234567';
  const mockPasswordHashString = mockTempKeyString + mockSignatureString;

  const fakeRead = jest.fn();
  const fakeCrypto = {
    timingSafeEqual: jest.fn(),
    createCipheriv: jest.fn(),
    createDecipheriv: jest.fn(),
    randomBytes: jest.fn(),
    pbkdf2: jest.fn(),
  };

  const exampleKeyData: KeyData = {
    version: 'v1',
    id: exampleKeyId,
    encryptedKey: mockEncryptedKeyString,
    iv: Buffer.from(mockIvString).toString(ENCODING),
    salt: Buffer.from(mockSaltString).toString(ENCODING),
    signature: Buffer.from(mockSignatureString).toString(ENCODING),
  };

  const fakeCipher = {
    update: jest.fn(),
    final: jest.fn(),
  };

  const fakeDecipher = {
    update: jest.fn(),
    final: jest.fn(),
  };

  const mockUserInput = (inputString: string) => {
    fakeRead.mockImplementationOnce((_, callback) => {
      callback(null, inputString);
    });
  };

  const mockRandomBytes = (byteString: string) => {
    fakeCrypto.randomBytes.mockImplementationOnce(
      (length: number, callback) => {
        callback(null, Buffer.from(byteString));
      }
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();

    fakeCrypto.timingSafeEqual.mockImplementation(timingSafeEqual);

    fakeCrypto.randomBytes.mockImplementation((length: number, callback) => {
      callback(null, Buffer.alloc(length));
    });

    fakeCrypto.pbkdf2.mockImplementation((p, s, i, l, d, callback) => {
      callback(null, Buffer.from(mockPasswordHashString));
    });

    fakeCrypto.createCipheriv.mockReturnValue(fakeCipher);
    fakeCrypto.createDecipheriv.mockReturnValue(fakeDecipher);

    fakeDecipher.update.mockReturnValue(Buffer.from(mockKeyString));
    fakeCipher.update.mockReturnValue(mockEncryptedKeyString.slice(0, 3));
    fakeCipher.final.mockReturnValue(mockEncryptedKeyString.slice(3));

    target = new KeyManagerV1(fakeRead, fakeCrypto);
  });

  it('should construct itself', () => {
    target = new KeyManagerV1();
    expect(target.constructor.name).toBe('KeyManagerV1');
  });

  describe('addKey', () => {
    it('should add multiple keys with different ids', () => {
      target.addKey(exampleKeyData);
      target.addKey({ ...exampleKeyData, id: 'key2' });
      target.addKey({ ...exampleKeyData, id: 'key3' });
    });

    it('should only add a key with a given id once', () => {
      target.addKey(exampleKeyData);
      expect(() => target.addKey({ ...exampleKeyData })).toThrow();
    });
  });

  describe('getKey', () => {
    it('should get the key if it has been added', () => {
      target.addKey(exampleKeyData);
      expect(target.getKey(exampleKeyData.id)).toBe(exampleKeyData);
    });

    it('should throw an error if the key with the given id has not been added', () => {
      expect(() => target.getKey(exampleKeyData.id)).toThrow();
    });
  });

  describe('lockKey', () => {
    it('should overwrite and delete the decrptyed key if present', () => {
      const decryptedKey = Buffer.from(mockKeyString);
      const keyData = { ...exampleKeyData, decryptedKey };
      target.addKey(keyData);
      target.lockKey(keyData.id);
      expect(decryptedKey).toEqual(Buffer.alloc(mockKeyString.length));
      expect(keyData.decryptedKey).toBeUndefined();
    });

    it('should do nothing if they key is not locked', () => {
      target.addKey({ ...exampleKeyData });
      target.lockKey(exampleKeyData.id);
      expect(target.getKey(exampleKeyData.id)).toEqual(exampleKeyData);
    });
  });

  describe('lockAllKeys', () => {
    it('should overwrite and delete all the decrptyed keys', () => {
      const decryptedKey1 = Buffer.from(mockKeyString);
      const decryptedKey2 = Buffer.from(mockKeyString);

      const locked1 = { ...exampleKeyData, id: 'locked1' };
      const locked2 = { ...exampleKeyData, id: 'locked2' };
      const unlocked1 = {
        ...exampleKeyData,
        id: 'unlocked1',
        decryptedKey: decryptedKey1,
      };
      const unlocked2 = {
        ...exampleKeyData,
        id: 'unlocked2',
        decryptedKey: decryptedKey2,
      };

      target.addKey(locked1);
      target.addKey(locked2);
      target.addKey(unlocked1);
      target.addKey(unlocked2);
      target.lockAllKeys();

      expect(decryptedKey1).toEqual(Buffer.alloc(mockKeyString.length));
      expect(decryptedKey2).toEqual(Buffer.alloc(mockKeyString.length));
      expect(unlocked1.decryptedKey).toBeUndefined();
      expect(unlocked2.decryptedKey).toBeUndefined();
    });
  });

  describe('removeKey', () => {
    it('should return immediately if the key does not exist', () => {
      const missingId = 'missingno';
      target.addKey({ ...exampleKeyData });
      target.removeKey(missingId);
      expect(target.getKey(exampleKeyId)).toEqual(exampleKeyData);
    });

    it('should delete the key data', () => {
      target.addKey({ ...exampleKeyData });
      target.removeKey(exampleKeyData.id);
      expect(() => target.getKey(exampleKeyData.id)).toThrow();
    });

    it('should also overwrite the decrypted key if applicable', () => {
      const decryptedKey = Buffer.from(mockKeyString);
      target.addKey({ ...exampleKeyData, decryptedKey });
      target.removeKey(exampleKeyData.id);
      expect(decryptedKey).toEqual(Buffer.alloc(mockKeyString.length));
    });
  });

  describe('reset', () => {
    it('should delete all key data and overwrite keys if applicable', () => {
      const decryptedKey1 = Buffer.from(mockKeyString);
      const decryptedKey2 = Buffer.from(mockKeyString);

      const keys = [
        { ...exampleKeyData, id: 'locked1' },
        { ...exampleKeyData, id: 'locked2' },

        {
          ...exampleKeyData,
          id: 'unlocked1',
          decryptedKey: decryptedKey1,
        },
        {
          ...exampleKeyData,
          id: 'unlocked2',
          decryptedKey: decryptedKey2,
        },
      ];

      keys.forEach(k => {
        target.addKey(k);
      });

      target.reset();

      expect(decryptedKey1).toEqual(Buffer.alloc(mockKeyString.length));
      expect(decryptedKey2).toEqual(Buffer.alloc(mockKeyString.length));

      keys.forEach(k => {
        expect(() => target.getKey(k.id)).toThrow();
      });
    });
  });

  describe('createNewKey', () => {
    beforeEach(() => {
      mockRandomBytes(mockKeyString);
      mockRandomBytes(mockIvString);
      mockRandomBytes(mockSaltString);
    });

    it('should throw an error if the key already exists', async () => {
      target.addKey(exampleKeyData);
      await expect(target.createNewKey(exampleKeyId)).rejects.toThrow();
    });

    it('should prompt the user for the password', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(fakeRead.mock.calls[0][0]).toEqual({
        prompt: `Enter password to encrypt key ${exampleKeyId}: `,
        silent: true,
      });
    });

    it('should prompt the user to confirm the password', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(fakeRead.mock.calls[1][0]).toEqual({
        prompt: 'Confirm password: ',
        silent: true,
      });
    });

    it('should retry until a pair of passwords match', async () => {
      mockUserInput('password1');
      mockUserInput('password2');
      mockUserInput('password3');
      mockUserInput('password4');
      mockUserInput('password5');
      mockUserInput('password5');

      await target.createNewKey(exampleKeyId);
      expect(fakeRead.mock.calls.length).toBe(6);
    });

    it('should set the version to be v1', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).version).toBe(VERSION);
    });

    it('should set the id to be what the user inputs first', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).id).toBe(exampleKeyId);
    });

    it('should set a randomly generated initialization vector', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).iv).toBe(
        Buffer.from(mockIvString).toString(ENCODING)
      );
    });

    it('should set a randomly generated salt', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).salt).toBe(
        Buffer.from(mockSaltString).toString(ENCODING)
      );
    });

    it('should hash the password with the salt to produce a hash twice the desired key length', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(exampleKeyId);

      const [
        [password, salt, iterationCount, length, digest],
      ] = fakeCrypto.pbkdf2.mock.calls;

      expect(password).toBe(mockPassword);
      expect(salt).toEqual(Buffer.from(mockSaltString));
      expect(iterationCount).toBe(ITER_COUNT);
      expect(length).toBe(2 * KEY_LENGTH);
      expect(digest).toBe(HASH_DIGEST);
    });

    it('should use the second half of the password hash as the signature', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).signature).toBe(
        Buffer.from(mockSignatureString).toString(ENCODING)
      );
    });

    it('should create a new Cipher using the initialization vector and the first half of the password hash', async () => {
      let algorithm = '';
      let keyString = '';
      let ivString = '';

      fakeCrypto.createCipheriv.mockReset();
      fakeCrypto.createCipheriv.mockImplementationOnce((alg, key, iv) => {
        algorithm = alg;
        keyString = key.toString();
        ivString = iv.toString();
        return fakeCipher;
      });

      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);

      expect(algorithm).toBe(ALG);
      expect(keyString).toBe(mockTempKeyString);
      expect(ivString).toBe(mockIvString);
    });

    it('should set the encrypted key string using the cipher output', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).encryptedKey).toBe(
        Buffer.from(mockEncryptedKeyString).toString()
      );
    });

    it('should leave the key unlocked', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      expect(target.getKey(exampleKeyId).decryptedKey).toEqual(
        Buffer.from(mockKeyString)
      );
    });
  });

  describe('getDecryptedKey', () => {
    beforeEach(async () => {
      mockRandomBytes(mockKeyString);
      mockRandomBytes(mockIvString);
      mockRandomBytes(mockSaltString);

      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      target.lockKey(exampleKeyId);
    });

    it('should return key withough prompting for password if it is alrady unlocked', async () => {
      const id = 'id2';
      fakeRead.mockClear();
      target.addKey({
        ...exampleKeyData,
        id,
        decryptedKey: Buffer.from(mockKeyString),
      });

      const result = await target.getDecryptedKey(id);

      expect(result).toEqual(Buffer.from(mockKeyString));
      expect(fakeRead).not.toHaveBeenCalled();
    });

    it('should prompt for a password to unlock the key if locked', async () => {
      fakeRead.mockClear();
      mockUserInput(mockPassword);
      await target.getDecryptedKey(exampleKeyId);
      expect(fakeRead.mock.calls[0][0]).toEqual({
        prompt: `Enter password to decrypt key ${exampleKeyId}: `,
        silent: true,
      });
    });

    it('should hash the password with the salt to produce a hash twice the desired key length', async () => {
      mockUserInput(mockPassword);
      await target.getDecryptedKey(exampleKeyId);

      const [
        [password, salt, iterationCount, length, digest],
      ] = fakeCrypto.pbkdf2.mock.calls;

      expect(password).toBe(mockPassword);
      expect(salt).toEqual(Buffer.from(mockSaltString));
      expect(iterationCount).toBe(ITER_COUNT);
      expect(length).toBe(2 * KEY_LENGTH);
      expect(digest).toBe(HASH_DIGEST);
    });

    it('should verify the password by comparing the signature and the second half of the hasth', async () => {
      let storedSignature = '';
      let signagureFromHash = '';
      mockUserInput(mockPassword);

      fakeCrypto.timingSafeEqual.mockReset();
      fakeCrypto.timingSafeEqual.mockImplementationOnce((sig1, sig2) => {
        storedSignature = sig1.toString();
        signagureFromHash = sig2.toString();
        return storedSignature === signagureFromHash;
      });

      await target.getDecryptedKey(exampleKeyId);
      expect(fakeCrypto.timingSafeEqual).toHaveBeenCalled();
      expect(storedSignature).toEqual(mockSignatureString);
      expect(signagureFromHash).toEqual(mockSignatureString);
    });

    it('should retry if the signature from the password hash does not match', async () => {
      const badSignature = 'BADSIGNATURE1234';
      mockUserInput('wrongPassword');
      mockUserInput(mockPassword);

      fakeCrypto.pbkdf2.mockReset();
      fakeCrypto.pbkdf2.mockImplementationOnce((p, s, i, l, d, callback) => {
        callback(null, Buffer.from(mockTempKeyString + badSignature));
      });
      fakeCrypto.pbkdf2.mockImplementationOnce((p, s, i, l, d, callback) => {
        callback(null, Buffer.from(mockTempKeyString + mockSignatureString));
      });

      await target.getDecryptedKey(exampleKeyId);
      expect(fakeCrypto.timingSafeEqual).toHaveBeenCalledTimes(2);
      expect(fakeCrypto.pbkdf2).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if the maximum number of retries is execeeded', async () => {
      const badSignature = 'BADSIGNATURE1234';
      const badPassword = 'tunafish';

      for (let i = 0; i <= MAX_RETRIES; i++) {
        mockUserInput(badPassword);
      }

      fakeCrypto.pbkdf2.mockReset();
      fakeCrypto.pbkdf2.mockImplementation((p, s, i, l, d, callback) => {
        callback(null, Buffer.from(mockTempKeyString + badSignature));
      });

      await expect(target.getDecryptedKey(exampleKeyId)).rejects.toThrow();

      expect(fakeCrypto.timingSafeEqual).toHaveBeenCalledTimes(MAX_RETRIES + 1);
      expect(fakeCrypto.pbkdf2).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    it('should create a new Decipher object using the initialization vector and the first half of the password hash', async () => {
      let algorithm = '';
      let keyString = '';
      let ivString = '';

      fakeCrypto.createDecipheriv.mockReset();
      fakeCrypto.createDecipheriv.mockImplementationOnce((alg, key, iv) => {
        algorithm = alg;
        keyString = key.toString();
        ivString = iv.toString();
        return fakeCipher;
      });

      mockUserInput(mockPassword);
      await target.getDecryptedKey(exampleKeyId);

      expect(algorithm).toBe(ALG);
      expect(keyString).toBe(mockTempKeyString);
      expect(ivString).toBe(mockIvString);
    });

    it('should set the decrypted key to be the return value from the Decipher call', async () => {
      const decryptedKey = 'super secret key II';
      fakeDecipher.update.mockReset();
      fakeDecipher.update.mockReturnValue(Buffer.from(decryptedKey));

      mockUserInput(mockPassword);
      await target.getDecryptedKey(exampleKeyId);

      expect(target.getKey(exampleKeyId).decryptedKey).toEqual(
        Buffer.from(decryptedKey)
      );
    });

    it('should return the decrypted key', async () => {
      mockUserInput(mockPassword);
      expect(await target.getDecryptedKey(exampleKeyId)).toEqual(
        Buffer.from(mockKeyString)
      );
    });
  });

  describe('changeKeyPassword', () => {
    const newIvString = 'IV2_IV2_IV2_IV2_';
    const newSaltString = 'SALT2SALT2SALT2_';
    const newPassword = 'hunter2';

    beforeEach(async () => {
      mockRandomBytes(mockKeyString);
      mockRandomBytes(mockIvString);
      mockRandomBytes(mockSaltString);

      mockRandomBytes(newIvString);
      mockRandomBytes(newSaltString);

      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(exampleKeyId);
      target.lockKey(exampleKeyId);
    });

    it('shoud set the new salt value', async () => {
      mockUserInput(mockPassword);
      mockUserInput(newPassword);
      mockUserInput(newPassword);

      await target.changeKeyPassword(exampleKeyId);
      const newKeyData = await target.getKey(exampleKeyId);
      expect(newKeyData.salt).toBe(
        Buffer.from(newSaltString).toString(ENCODING)
      );
    });

    it('shoud set the new IV value', async () => {
      mockUserInput(mockPassword);
      mockUserInput(newPassword);
      mockUserInput(newPassword);

      await target.changeKeyPassword(exampleKeyId);
      const newKeyData = await target.getKey(exampleKeyId);
      expect(newKeyData.iv).toBe(Buffer.from(newIvString).toString(ENCODING));
    });

    it('should set the new encrypted key', async () => {
      const part1 = 'KeyPart1';
      const part2 = 'KeyPart2';
      const newEncryptedKeyString = part1 + part2;

      mockUserInput(mockPassword);
      mockUserInput(newPassword);
      mockUserInput(newPassword);

      fakeCipher.update.mockReset();
      fakeCipher.final.mockReset();
      fakeCipher.update.mockReturnValue(part1);
      fakeCipher.final.mockReturnValue(part2);

      await target.changeKeyPassword(exampleKeyId);
      const newKeyData = await target.getKey(exampleKeyId);
      expect(newKeyData.encryptedKey).toBe(newEncryptedKeyString);
    });

    it('should not change the key', async () => {
      mockUserInput(mockPassword);
      mockUserInput(newPassword);
      mockUserInput(newPassword);

      await target.changeKeyPassword(exampleKeyId);
      const key = await target.getDecryptedKey(exampleKeyId);
      expect(key).toEqual(Buffer.from(mockKeyString));
    });
  });
});
