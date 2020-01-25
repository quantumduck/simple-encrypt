import { Main } from '.';

describe('Main', () => {
  const mockLogger = {
    emergency: jest.fn(),
    alert: jest.fn(),
    critical: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    notice: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  it('should construct itself', () => {
    const target = new Main();
    expect(target.constructor.name).toBe('Main');
  });

  describe('runOnce', () => {
    it('should log that it has started', async () => {
      const target = new Main({ logger: mockLogger });
      await target.runOnce();
      expect(mockLogger.notice).toHaveBeenCalledWith('Started');
    });
  });
});
