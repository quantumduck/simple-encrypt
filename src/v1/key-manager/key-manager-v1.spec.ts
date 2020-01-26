import { KeyManagerV1 } from '..';
import { KeyData } from '../v1.models';

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
    id: 'key1',
    encryptedKey: mockEncryptedKeyString,
    iv: 'iv1',
    salt: 'salt1',
    signature: 'sig1',
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
    const newKeyId = 'new1';

    beforeEach(() => {
      mockRandomBytes(mockKeyString);
      mockRandomBytes(mockIvString);
      mockRandomBytes(mockSaltString);
    });

    it('should prompt the user for the password', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
      expect(fakeRead.mock.calls[0][0]).toEqual({
        prompt: `Enter password to encrypt key ${newKeyId}: `,
        silent: true,
      });
    });

    it('should prompt the user to confirm the password', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
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

      await target.createNewKey(newKeyId);
      expect(fakeRead.mock.calls.length).toBe(6);
    });

    it('should set the version to be v1', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).version).toBe(VERSION);
    });

    it('should set the id to be what the user inputs first', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).id).toBe(newKeyId);
    });

    it('should set a randomly generated initialization vector', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).iv).toBe(
        Buffer.from(mockIvString).toString(ENCODING)
      );
    });

    it('should set a randomly generated salt', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).salt).toBe(
        Buffer.from(mockSaltString).toString(ENCODING)
      );
    });

    it('should hash the password with the salt to produce a hash twice the desired key length', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);
      await target.createNewKey(newKeyId);

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

      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).signature).toBe(
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

      await target.createNewKey(newKeyId);

      expect(algorithm).toBe(ALG);
      expect(keyString).toBe(mockTempKeyString);
      expect(ivString).toBe(mockIvString);
    });

    it('should set the encrypted key string using the cipher output', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).encryptedKey).toBe(
        Buffer.from(mockEncryptedKeyString).toString()
      );
    });

    it('should leave the key unlocked', async () => {
      mockUserInput(mockPassword);
      mockUserInput(mockPassword);

      await target.createNewKey(newKeyId);
      expect(target.getKey(newKeyId).decryptedKey).toEqual(
        Buffer.from(mockKeyString)
      );
    });
  });

  describe('getDecryptedKey', () => {
    it('should ', async () => {});
  });
});
