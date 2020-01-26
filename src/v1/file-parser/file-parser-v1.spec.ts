import { FileParserV1 } from '..';
import { KeyData } from '../v1.models';

describe('FileParserV1', () => {
  const target = FileParserV1;

  const validKeyData: KeyData = {
    version: 'v1',
    id: 'testId',
    encryptedKey: 'testKeyString',
    iv: 'testIV',
    signature: 'testSig',
    salt: 'testSalt',
  };

  const validHeader = [
    'V:v1',
    'ID:testId',
    'K:testKeyString',
    'IV:testIV',
    'SG:testSig',
    'S:testSalt',
  ];

  const validBodyChunks = [
    ['IV1', 'data 11', 'data 12'],
    ['IV2', 'data 21', 'data 22', 'data 23'],
    ['IV3', 'data 31', 'data 32', 'data 33', 'data 34'],
  ];

  const validParsedBodyData = [
    { iv: validBodyChunks[0][0], data: validBodyChunks[0].slice(1) },
    { iv: validBodyChunks[1][0], data: validBodyChunks[1].slice(1) },
    { iv: validBodyChunks[2][0], data: validBodyChunks[2].slice(1) },
  ];

  const validFile = [
    ...validHeader,
    '',
    ...validBodyChunks[0],
    '',
    ...validBodyChunks[1],
    '',
    ...validBodyChunks[2],
    '',
  ];

  describe('parseHeader', () => {
    it('should parse a valid header', () => {
      expect(target.parseHeader(validHeader)).toEqual(validKeyData);
    });

    it('should throw an error if there is an extra line', () => {
      const invalidHeader = validHeader.slice();
      invalidHeader.push('O:other');
      expect(() => target.parseHeader(invalidHeader)).toThrow();
    });

    it('should throw an error if a line is missing the ":" separator', () => {
      const invalidHeader = validHeader.slice();
      invalidHeader[2] = 'badFormatting';
      expect(() => target.parseHeader(invalidHeader)).toThrow();
    });

    it('should throw an error if the version is incorrect', () => {
      const invalidHeader = validHeader.slice();
      invalidHeader[0] = 'V:v2';
      expect(() => target.parseHeader(invalidHeader)).toThrow();
    });
  });

  describe('parseBody', () => {
    it('should map the first line of each chunk to the iv property', () => {
      const results = target.parseBody(validBodyChunks);
      expect(results.length).toBe(validBodyChunks.length);
      results.forEach((result, i) => {
        expect(result.iv).toBe(validBodyChunks[i][0]);
      });
    });

    it('should map the other lines of each chunk to the data property', () => {
      const results = target.parseBody(validBodyChunks);
      expect(results.length).toBe(validBodyChunks.length);
      results.forEach((result, i) => {
        expect(result.data).toEqual(validBodyChunks[i].slice(1));
      });
    });
  });

  describe('parseFile', () => {
    it('should correctly spit the file into header and body chunks and parse them', () => {
      expect(target.parseFile(validFile)).toEqual({
        header: validKeyData,
        body: validParsedBodyData,
      });
    });

    it('should parse file without a blank line at the end', () => {
      const validFile2 = validFile.slice(0, -1);

      expect(target.parseFile(validFile2)).toEqual({
        header: validKeyData,
        body: validParsedBodyData,
      });
    });

    it('should skip comments', () => {
      const validFile3 = ['# Comment', ...validFile];

      expect(target.parseFile(validFile3)).toEqual({
        header: validKeyData,
        body: validParsedBodyData,
      });
    });
  });

  describe('stringify', () => {
    it('should reproduce the original header and body chunks, separated by blank lines', () => {
      const result = target.stringify(validKeyData, validParsedBodyData);
      expect(result).toEqual(validFile);
    });
  });
});
