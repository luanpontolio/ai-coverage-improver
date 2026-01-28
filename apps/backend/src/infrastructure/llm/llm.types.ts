/**
 * LLM Configuration and Request/Response types
*/
export interface LLMConfig {
    apiBase: string;
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

export interface DetailedCoverageData {
  currentCoverage: number;
  uncoveredLines: number[];
  uncoveredFunctions?: string[];
  totalLines: number;
  coveredLines: number;
}

export interface GenerateTestRequest {
  sourceCode: string;
  filePath: string;
  language: 'typescript';
  existingTestCode?: string;
  coverageData?: DetailedCoverageData;
}

export interface GenerateTestResponse {
    testCode: string;
    confidence: number;
}

// OpenAI-compatible API types
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMChatRequest {
    model: string;
    messages: LLMMessage[];
    temperature?: number;
    max_tokens?: number;
}

export interface LLMChatResponse {
    id: string;
    choices: Array<{
        message: {
        role: string;
        content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
