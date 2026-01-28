import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/config.module';
import { AppConfigService } from '../../config/config.service';
import { LLMAdapter } from './llm.adapter';

/**
 * Test module for LLM integration
 * Uses NestJS DI to properly initialize ConfigService
 */
@Module({
  imports: [AppConfigModule],
  providers: [LLMAdapter],
})
class TestModule {}

async function testLLM() {
  console.log('🚀 Initializing NestJS application context...\n');

  // Create NestJS standalone application with DI
  const app = await NestFactory.createApplicationContext(TestModule, {
    logger: false, // Disable NestJS logs for cleaner output
  });

  try {
    // Get services from DI container
    const configService = app.get(AppConfigService);
    const adapter = app.get(LLMAdapter);

    // Validate configuration
    console.log('🔍 Validating configuration...');
    try {
      configService.validate();
      console.log('✅ Configuration is valid\n');
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      process.exit(1);
    }

    // Display configuration info (without secrets)
    console.log('⚙️  Configuration:');
    console.log(`   LLM API Base: ${configService.llm.apiBase}`);
    console.log(`   LLM Model: ${configService.llm.model}`);
    console.log(`   LLM Max Tokens: ${configService.llm.maxTokens}`);
    console.log(`   LLM Temperature: ${configService.llm.temperature}`);
    console.log(`   API Key: ${configService.llm.apiKey.substring(0, 10)}...\n`);

    console.log('🧪 Testing LLM integration...\n');

    // 1. Health check
    console.log('1️⃣ Health check...');
    const isHealthy = await adapter.healthCheck();
    console.log(`   Health: ${isHealthy ? '✅ OK' : '❌ FAIL'}\n`);

    if (!isHealthy) {
      console.error('❌ LLM health check failed. Please verify your LLM_API_KEY and LLM_API_BASE.');
      process.exit(1);
    }

    // 2. Generate simple test
    console.log('2️⃣ Generating test for simple function...');
    const result = await adapter.generateTest({
      sourceCode: `
export function multiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return a * b;
}
      `,
      filePath: 'src/utils/math.ts',
      language: 'typescript',
      coverageData: {
        currentCoverage: 0,
        uncoveredLines: [1, 2, 3],
        uncoveredFunctions: ['multiply'],
        totalLines: 3,
        coveredLines: 0,
      },
    });

    console.log(`   Generated ${result.testCode.length} chars`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log('\n📝 Generated Test:\n');
    console.log('─'.repeat(80));
    console.log(result.testCode);
    console.log('─'.repeat(80));
    
    console.log('\n✅ Test completed successfully!');
  } finally {
    // Clean up
    await app.close();
  }
}

// Run test
testLLM().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
