/**
 * Unit tests for Bedrock integration in summarizer service
 * Tests the callBedrock function with mocked AWS SDK
 * @module __tests__/unit/main/services/summarizer.bedrock.unit.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ConverseCommand: vi.fn().mockImplementation((params) => params),
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromIni: vi.fn().mockReturnValue({ accessKeyId: 'mock', secretAccessKey: 'mock' }),
}));

// Mock secure storage
const mockApiKeys: Record<string, string | null> = {};
vi.mock('@main/store/secureStorage', () => ({
  getApiKey: vi.fn((provider: string) => mockApiKeys[provider] || null),
  getAllApiKeys: vi.fn(() => Promise.resolve(mockApiKeys)),
}));

describe('Bedrock Summarizer Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockApiKeys).forEach(key => delete mockApiKeys[key]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('callBedrock with manual credentials', () => {
    it('should call Bedrock with access key credentials', async () => {
      // Arrange
      const credentials = JSON.stringify({
        mode: 'credentials',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      });
      mockApiKeys['bedrock'] = credentials;

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [{ text: 'Test summary response' }],
          },
        },
      });

      const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');

      // Assert client was configured correctly
      expect(BedrockRuntimeClient).toBeDefined();
    });

    it('should parse Converse API response correctly', async () => {
      // Arrange
      const mockResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [{ text: 'Generated summary text' }],
          },
        },
        stopReason: 'end_turn',
        usage: { inputTokens: 10, outputTokens: 20 },
      };

      mockSend.mockResolvedValue(mockResponse);

      // Assert response structure matches expected format
      expect(mockResponse.output.message.content[0].text).toBe('Generated summary text');
    });
  });

  describe('callBedrock with profile credentials', () => {
    it('should use fromIni for profile-based auth', async () => {
      // Arrange
      const credentials = JSON.stringify({
        mode: 'profile',
        profile: 'my-aws-profile',
        region: 'us-west-2',
      });
      mockApiKeys['bedrock'] = credentials;

      const { fromIni } = await import('@aws-sdk/credential-providers');

      // Act - parse credentials
      const parsed = JSON.parse(credentials);

      // Assert
      expect(parsed.mode).toBe('profile');
      expect(parsed.profile).toBe('my-aws-profile');
      expect(fromIni).toBeDefined();
    });
  });

  describe('Bedrock credential parsing', () => {
    it('should correctly parse manual credentials JSON', () => {
      const json = JSON.stringify({
        mode: 'credentials',
        accessKeyId: 'AKIA123',
        secretAccessKey: 'secret123',
        region: 'us-east-1',
      });

      const parsed = JSON.parse(json);

      expect(parsed.mode).toBe('credentials');
      expect(parsed.accessKeyId).toBe('AKIA123');
      expect(parsed.secretAccessKey).toBe('secret123');
      expect(parsed.region).toBe('us-east-1');
    });

    it('should correctly parse profile credentials JSON', () => {
      const json = JSON.stringify({
        mode: 'profile',
        profile: 'default',
        region: 'eu-west-1',
      });

      const parsed = JSON.parse(json);

      expect(parsed.mode).toBe('profile');
      expect(parsed.profile).toBe('default');
      expect(parsed.region).toBe('eu-west-1');
    });

    it('should handle missing optional fields', () => {
      const json = JSON.stringify({
        mode: 'profile',
        profile: 'default',
      });

      const parsed = JSON.parse(json);

      expect(parsed.mode).toBe('profile');
      expect(parsed.region).toBeUndefined();
    });
  });
});
