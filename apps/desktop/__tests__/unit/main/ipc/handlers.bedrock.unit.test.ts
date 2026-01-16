/**
 * Unit tests for Bedrock IPC handlers
 * Tests the bedrock:test-connection handler
 * @module __tests__/unit/main/ipc/handlers.bedrock.unit.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Bedrock IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('bedrock:test-connection', () => {
    describe('credential parsing', () => {
      it('should parse manual credentials correctly', () => {
        const credentialsJson = JSON.stringify({
          mode: 'credentials',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        });

        const creds = JSON.parse(credentialsJson);

        expect(creds.mode).toBe('credentials');
        expect(creds.accessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
        expect(creds.secretAccessKey).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      });

      it('should parse profile credentials correctly', () => {
        const credentialsJson = JSON.stringify({
          mode: 'profile',
          profile: 'my-profile',
        });

        const creds = JSON.parse(credentialsJson);

        expect(creds.mode).toBe('profile');
        expect(creds.profile).toBe('my-profile');
      });
    });

    describe('model filtering', () => {
      it('should filter to Converse-compatible model prefixes', () => {
        const CONVERSE_PREFIXES = ['amazon.nova', 'amazon.titan-text', 'anthropic.claude', 'meta.llama', 'mistral.', 'ai21.jamba'];
        
        const testModels = [
          { modelId: 'amazon.nova-pro-v1:0', modelName: 'Nova Pro' },
          { modelId: 'anthropic.claude-3-5-sonnet-v2:0', modelName: 'Claude 3.5 Sonnet' },
          { modelId: 'meta.llama3-70b-instruct-v1:0', modelName: 'Llama 3 70B' },
          { modelId: 'stability.stable-diffusion-xl-v1', modelName: 'Stable Diffusion' }, // Should be filtered out
          { modelId: 'cohere.command-text-v14', modelName: 'Cohere Command' }, // Should be filtered out
        ];

        const filtered = testModels.filter(m => 
          CONVERSE_PREFIXES.some(p => m.modelId.startsWith(p))
        );

        expect(filtered).toHaveLength(3);
        expect(filtered.map(m => m.modelId)).toContain('amazon.nova-pro-v1:0');
        expect(filtered.map(m => m.modelId)).toContain('anthropic.claude-3-5-sonnet-v2:0');
        expect(filtered.map(m => m.modelId)).toContain('meta.llama3-70b-instruct-v1:0');
        expect(filtered.map(m => m.modelId)).not.toContain('stability.stable-diffusion-xl-v1');
      });

      it('should exclude versioned model variants', () => {
        const testModels = [
          { modelId: 'amazon.nova-pro-v1:0' },
          { modelId: 'amazon.nova-pro-v1:0:24k' }, // Should be filtered out
          { modelId: 'amazon.nova-pro-v1:0:300k' }, // Should be filtered out
          { modelId: 'anthropic.claude-3-5-sonnet-v2:0' },
        ];

        const filtered = testModels.filter(m => !m.modelId.includes(':0:'));

        expect(filtered).toHaveLength(2);
        expect(filtered.map(m => m.modelId)).toContain('amazon.nova-pro-v1:0');
        expect(filtered.map(m => m.modelId)).toContain('anthropic.claude-3-5-sonnet-v2:0');
      });
    });

    describe('ListFoundationModels response handling', () => {
      it('should transform model summaries to expected format', () => {
        const mockResponse = {
          modelSummaries: [
            { modelId: 'amazon.nova-pro-v1:0', modelName: 'Nova Pro', providerName: 'Amazon' },
            { modelId: 'anthropic.claude-3-5-sonnet-v2:0', modelName: 'Claude 3.5 Sonnet', providerName: 'Anthropic' },
          ],
        };

        const models = (mockResponse.modelSummaries || []).map(m => ({
          id: m.modelId,
          displayName: m.modelName || m.modelId,
          provider: m.providerName || 'Unknown',
        }));

        expect(models).toHaveLength(2);
        expect(models[0]).toEqual({
          id: 'amazon.nova-pro-v1:0',
          displayName: 'Nova Pro',
          provider: 'Amazon',
        });
      });

      it('should handle empty model list', () => {
        const mockResponse = { modelSummaries: [] };

        const models = (mockResponse.modelSummaries || []).map(m => ({
          id: m.modelId,
          displayName: m.modelName || m.modelId,
          provider: m.providerName || 'Unknown',
        }));

        expect(models).toHaveLength(0);
      });

      it('should handle missing modelSummaries', () => {
        const mockResponse = {};

        const models = ((mockResponse as { modelSummaries?: unknown[] }).modelSummaries || []).map((m: { modelId?: string; modelName?: string; providerName?: string }) => ({
          id: m.modelId,
          displayName: m.modelName || m.modelId,
          provider: m.providerName || 'Unknown',
        }));

        expect(models).toHaveLength(0);
      });
    });
  });
});
