import { KeyData } from '..';
import { Dictionary } from '../../util';
import { EncryptedDataChunk } from '../v1.models';

export class ParserV1 {
  readonly VERSION = 'v1';

  parseHeader(headerLines: string[]): KeyData {
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

  parseBody(bodyLines: string[]): EncryptedDataChunk[] {
    const chunks: EncryptedDataChunk[] = [];
    let isStartofChunk = true;
    let chunkIndex = 0;

    bodyLines.forEach(line => {
      if (isStartofChunk && line !== '') {
        isStartofChunk = false;
        chunks.push({ iv: line, data: [] });
      } else if (line === '') {
        isStartofChunk = true;
        chunkIndex++;
      } else {
        chunks[chunkIndex].data.push(line);
      }
    });

    return chunks;
  }

  stringifyHeader(header: KeyData): string[] {
    return [
      `V:${header.version}`,
      `ID:${header.id}`,
      `K:${header.encryptedKey}`,
      `IV:${header.iv}`,
      `SG:${header.signature}`,
      `S:${header.salt}`,
    ];
  }

  stringifyData(data: EncryptedDataChunk[]): string[] {
    return data
      .map(chunk => [chunk.iv, ...chunk.data, ''])
      .reduce((c1, c2) => [...c1, ...c2], []);
  }

  stringify(header: KeyData, data: EncryptedDataChunk[]): string[] {
    return [...this.stringifyHeader(header), '', ...this.stringifyData(data)];
  }
}
