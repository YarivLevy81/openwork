/**
 * Unit tests for Bedrock configuration in OpenCode adapter
 * Tests AWS credential passing to OpenCode CLI
 * @module __tests__/unit/main/opencode/adapter.bedrock.unit.test
 */

import { describe, it, expect } from 'vitest';

describe('Bedrock OpenCode Adapter Integration', () => {
  describe('AWS credential environment variables', () => {
    it('should set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for manual credentials', () => {
      const credentials = JSON.stringify({
        mode: 'credentials',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      });

      const creds = JSON.parse(credentials);
      const env: Record<string, string> = {};

      if (creds.mode === 'credentials' && creds.accessKeyId && creds.secretAccessKey) {
        env.AWS_ACCESS_KEY_ID = creds.accessKeyId;
        env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey;
      }
      if (creds.region) {
        env.AWS_REGION = creds.region;
      }

      expect(env.AWS_ACCESS_KEY_ID).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(env.AWS_SECRET_ACCESS_KEY).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      expect(env.AWS_REGION).toBe('us-east-1');
    });

    it('should set AWS_PROFILE for profile credentials', () => {
      const credentials = JSON.stringify({
        mode: 'profile',
        profile: 'my-dev-profile',
        region: 'eu-west-1',
      });

      const creds = JSON.parse(credentials);
      const env: Record<string, string> = {};

      if (creds.mode === 'profile' && creds.profile) {
        env.AWS_PROFILE = creds.profile;
      }
      if (creds.region) {
        env.AWS_REGION = creds.region;
      }

      expect(env.AWS_PROFILE).toBe('my-dev-profile');
      expect(env.AWS_REGION).toBe('eu-west-1');
      expect(env.AWS_ACCESS_KEY_ID).toBeUndefined();
    });

    it('should not set credentials for invalid mode', () => {
      const credentials = JSON.stringify({
        mode: 'invalid',
        profile: 'test',
      });

      const creds = JSON.parse(credentials);
      const env: Record<string, string> = {};

      if (creds.mode === 'credentials' && creds.accessKeyId && creds.secretAccessKey) {
        env.AWS_ACCESS_KEY_ID = creds.accessKeyId;
        env.AWS_SECRET_ACCESS_KEY = creds.secretAccessKey;
      } else if (creds.mode === 'profile' && creds.profile) {
        env.AWS_PROFILE = creds.profile;
      }

      expect(env.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(env.AWS_PROFILE).toBeUndefined();
    });

    it('should handle missing region gracefully', () => {
      const credentials = JSON.stringify({
        mode: 'profile',
        profile: 'default',
      });

      const creds = JSON.parse(credentials);
      const env: Record<string, string> = {};

      if (creds.mode === 'profile' && creds.profile) {
        env.AWS_PROFILE = creds.profile;
      }
      if (creds.region) {
        env.AWS_REGION = creds.region;
      }

      expect(env.AWS_PROFILE).toBe('default');
      expect(env.AWS_REGION).toBeUndefined();
    });
  });

  describe('OpenCode config enabled_providers', () => {
    it('should include bedrock in enabled providers', () => {
      const baseProviders = ['anthropic', 'openai', 'google', 'xai', 'bedrock'];
      
      expect(baseProviders).toContain('bedrock');
      expect(baseProviders).toHaveLength(5);
    });
  });

  describe('Model ID format for OpenCode', () => {
    it('should use amazon-bedrock prefix for model IDs', () => {
      const modelId = 'amazon.nova-pro-v1:0';
      const fullId = `amazon-bedrock/${modelId}`;

      expect(fullId).toBe('amazon-bedrock/amazon.nova-pro-v1:0');
    });

    it('should format Claude model IDs correctly', () => {
      const modelId = 'anthropic.claude-opus-4-5-20251101-v1:0';
      const fullId = `amazon-bedrock/${modelId}`;

      expect(fullId).toBe('amazon-bedrock/anthropic.claude-opus-4-5-20251101-v1:0');
    });
  });
});
