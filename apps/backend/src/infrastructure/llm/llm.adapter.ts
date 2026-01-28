import { Injectable, Logger } from '@nestjs/common';
import { 
  LLMConfig, 
  GenerateTestRequest, 
  GenerateTestResponse,
  LLMChatRequest,
  LLMChatResponse 
} from './llm.types';
import { buildTestGenerationPrompt } from './prompts/test-generation.prompt';
import { AppConfigService } from '../../config/config.service';

/**
 * LLM Adapter - OpenAI-compatible API client
 * Supports: Groq, OpenAI, Together AI, OpenRouter, etc.
 */
@Injectable()
export class LLMAdapter {
  private readonly logger = new Logger(LLMAdapter.name);
  private readonly config: LLMConfig;

  constructor(private readonly configService: AppConfigService) {
    const llmConfig = this.configService.llm;
    
    this.config = {
      apiBase: llmConfig.apiBase,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      maxTokens: llmConfig.maxTokens,
      temperature: llmConfig.temperature,
    };

    this.logger.log(`🤖 LLM configured: ${this.config.model} at ${this.config.apiBase}`);
  }

  /**
   * Generate test code for a source file
   */
  async generateTest(request: GenerateTestRequest): Promise<GenerateTestResponse> {
    this.logger.log(`🤖 Generating tests for: ${request.filePath}`);

    const prompt = buildTestGenerationPrompt(request);

    const chatRequest: LLMChatRequest = {
      model: this.config.model,
      messages: prompt,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    };

    try {
      const response = await this.callLLM(chatRequest);
      const testCode = this.extractTestCode(response);

      this.logger.log(`✅ Generated ${testCode.length} characters of test code`);

      return {
        testCode,
        confidence: this.calculateConfidence(response),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to generate test: ${errorMessage}`);
      throw new Error(`LLM_GENERATION_FAILED: ${errorMessage}`);
    }
  }

  /**
   * Call LLM API (OpenAI-compatible)
   */
  private async callLLM(request: LLMChatRequest): Promise<LLMChatResponse> {
    const url = `${this.config.apiBase}/chat/completions`;
    
    this.logger.debug(`📡 Calling LLM: ${this.config.model}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data: LLMChatResponse = await response.json();
    
    if (data.usage) {
      this.logger.debug(`📊 Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    }

    return data;
  }

  /**
   * Extract test code from LLM response
   */
  private extractTestCode(response: LLMChatResponse): string {
    const content = response.choices[0]?.message?.content || '';

    // Extract code from markdown code blocks
    const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      // Get the largest code block (usually the test file)
      const codeBlocks = matches.map(m => m[1].trim());
      return codeBlocks.reduce((a, b) => a.length > b.length ? a : b);
    }

    // If no code blocks found, return content as-is
    this.logger.warn('⚠️  No code blocks found in response, using raw content');
    return content.trim();
  }

  /**
   * Calculate confidence score based on response quality
   */
  private calculateConfidence(response: LLMChatResponse): number {
    const choice = response.choices[0];
    if (!choice) return 0;

    let score = 0.5; // Base score

    // Good finish reason
    if (choice.finish_reason === 'stop') {
      score += 0.3;
    }

    // Content length (reasonable test file)
    const contentLength = choice.message.content.length;
    if (contentLength > 500) score += 0.1;
    if (contentLength > 1000) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Health check - verify LLM is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callLLM({
        model: this.config.model,
        messages: [
          { role: 'user', content: 'Reply with just "OK"' }
        ],
        max_tokens: 10,
        temperature: 0,
      });

      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`LLM health check failed: ${errorMessage}`);
      return false;
    }
  }
}