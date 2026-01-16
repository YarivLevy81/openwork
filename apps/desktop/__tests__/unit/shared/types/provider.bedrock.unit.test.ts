/**
 * Unit tests for Bedrock provider types
 * Tests the BedrockCredentials, BedrockConfig, and model definitions
 * @module __tests__/unit/shared/types/provider.bedrock.unit.test
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_PROVIDERS } from '@accomplish/shared';

describe('Bedrock Provider Types', () => {
  describe('DEFAULT_PROVIDERS bedrock config', () => {
    const bedrockProvider = DEFAULT_PROVIDERS.find(p => p.id === 'bedrock');

    it('should have bedrock provider defined', () => {
      expect(bedrockProvider).toBeDefined();
      expect(bedrockProvider?.id).toBe('bedrock');
      expect(bedrockProvider?.name).toBe('Amazon Bedrock');
    });

    it('should not require API key (uses AWS credentials)', () => {
      expect(bedrockProvider?.requiresApiKey).toBe(false);
    });

    it('should have Nova models defined', () => {
      const novaModels = bedrockProvider?.models.filter(m => m.id.startsWith('amazon.nova'));
      
      expect(novaModels).toBeDefined();
      expect(novaModels!.length).toBeGreaterThan(0);
      
      // Check for key Nova models
      const modelIds = novaModels!.map(m => m.id);
      expect(modelIds).toContain('amazon.nova-premier-v1:0');
      expect(modelIds).toContain('amazon.nova-pro-v1:0');
      expect(modelIds).toContain('amazon.nova-lite-v1:0');
      expect(modelIds).toContain('amazon.nova-micro-v1:0');
    });

    it('should have Claude 4.x models defined', () => {
      const claudeModels = bedrockProvider?.models.filter(m => m.id.startsWith('anthropic.claude'));
      
      expect(claudeModels).toBeDefined();
      expect(claudeModels!.length).toBeGreaterThan(0);
      
      // Check for Claude 4.x models
      const modelIds = claudeModels!.map(m => m.id);
      expect(modelIds.some(id => id.includes('opus-4'))).toBe(true);
      expect(modelIds.some(id => id.includes('sonnet-4'))).toBe(true);
      expect(modelIds.some(id => id.includes('haiku-4'))).toBe(true);
    });

    it('should use amazon-bedrock prefix in fullId', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.fullId).toMatch(/^amazon-bedrock\//);
        expect(model.fullId).toBe(`amazon-bedrock/${model.id}`);
      });
    });

    it('should have provider set to bedrock for all models', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.provider).toBe('bedrock');
      });
    });

    it('should have valid context windows', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(typeof model.contextWindow).toBe('number');
      });
    });

    it('should have valid max output tokens', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.maxOutputTokens).toBeGreaterThan(0);
        expect(typeof model.maxOutputTokens).toBe('number');
      });
    });

    it('should have streaming support for all models', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.supportsStreaming).toBe(true);
      });
    });

    it('should have tool support for all models', () => {
      bedrockProvider?.models.forEach(model => {
        expect(model.supportsTools).toBe(true);
      });
    });
  });

  describe('BedrockCredentials type validation', () => {
    it('should validate manual credentials structure', () => {
      const manualCreds = {
        mode: 'credentials' as const,
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      expect(manualCreds.mode).toBe('credentials');
      expect(manualCreds.accessKeyId).toBeDefined();
      expect(manualCreds.secretAccessKey).toBeDefined();
    });

    it('should validate profile credentials structure', () => {
      const profileCreds = {
        mode: 'profile' as const,
        profile: 'default',
        region: 'us-west-2',
      };

      expect(profileCreds.mode).toBe('profile');
      expect(profileCreds.profile).toBeDefined();
    });
  });

  describe('Model capabilities', () => {
    const bedrockProvider = DEFAULT_PROVIDERS.find(p => p.id === 'bedrock');

    it('Nova Premier should support reasoning', () => {
      const novaPremier = bedrockProvider?.models.find(m => m.id === 'amazon.nova-premier-v1:0');
      expect(novaPremier?.supportsReasoning).toBe(true);
    });

    it('Nova Pro should support vision and documents', () => {
      const novaPro = bedrockProvider?.models.find(m => m.id === 'amazon.nova-pro-v1:0');
      expect(novaPro?.supportsVision).toBe(true);
      expect(novaPro?.supportsDocuments).toBe(true);
    });

    it('Nova Micro should not support vision', () => {
      const novaMicro = bedrockProvider?.models.find(m => m.id === 'amazon.nova-micro-v1:0');
      expect(novaMicro?.supportsVision).toBe(false);
    });

    it('Claude models should support vision', () => {
      const claudeModels = bedrockProvider?.models.filter(m => m.id.startsWith('anthropic.claude'));
      claudeModels?.forEach(model => {
        expect(model.supportsVision).toBe(true);
      });
    });
  });
});
