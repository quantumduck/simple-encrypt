import { KeyData } from '..';
import { Dictionary } from '../../util';
import { EncryptedDataChunk } from '../v1.models';

export class FileParserV1 {
  static readonly VERSION = 'v1';

  static parseFile(fileLines: string[]) {
    const chunks = this.splitFile(fileLines);
    const header = this.parseHeader(chunks[0]);
    const body = this.parseBody(chunks.slice(1));
    return { header, body };
  }

  static stringify(header: KeyData, body: EncryptedDataChunk[]): string[] {
    return [...this.stringifyHeader(header), '', ...this.stringifyBody(body)];
  }

  static splitFile(fileLines: string[]) {
    const chunks: string[][] = [];
    let currentChunk: string[] = [];

    fileLines.forEach(line => {
      if (line === '' && currentChunk.length > 0) {
        chunks.push(currentChunk.slice());
        currentChunk = [];
      } else if (!this.isComment(line)) {
        currentChunk.push(line);
      }
    });

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  static parseHeader(headerLines: string[]): KeyData {
    const parsed: Dictionary<string> = {};
    if (headerLines.length !== 6) {
      throw Error('Invalid V1 Header');
    }

    headerLines.forEach(line => {
      const [k, v] = line.split(':');
      if (!k || !v) {
        throw Error('Invalid V1 Header');
      }
      parsed[k] = v;
    });

    if (
      parsed.V !== this.VERSION ||
      !parsed.ID ||
      !parsed.K ||
      !parsed.IV ||
      !parsed.SG ||
      !parsed.S
    ) {
      throw Error('Invalid V1 Header');
    }

    return {
      version: parsed.V,
      id: parsed.ID,
      encryptedKey: parsed.K,
      iv: parsed.IV,
      signature: parsed.SG,
      salt: parsed.S,
    };
  }

  static parseBody(bodyChunks: string[][]): EncryptedDataChunk[] {
    return bodyChunks.map(chunk => {
      return {
        iv: chunk[0],
        data: chunk.slice(1),
      };
    });
  }

  static stringifyHeader(header: KeyData): string[] {
    return [
      `V:${header.version}`,
      `ID:${header.id}`,
      `K:${header.encryptedKey}`,
      `IV:${header.iv}`,
      `SG:${header.signature}`,
      `S:${header.salt}`,
    ];
  }

  static stringifyBody(body: EncryptedDataChunk[]): string[] {
    return body
      .map(chunk => [chunk.iv, ...chunk.data, ''])
      .reduce((c1, c2) => [...c1, ...c2], []);
  }

  private static isComment(line: string): boolean {
    return line.trim()[0] === '#';
  }
}
