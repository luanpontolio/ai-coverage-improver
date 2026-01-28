/**
 * Queue Infrastructure
 * 
 * Exports BullMQ-based queue components for job processing.
 * 
 * Migration from in-memory (setImmediate) to BullMQ completed:
 * - ImprovementQueue (old) -> ImprovementProducer (new)
 * - improvement.worker.ts (old) -> ImprovementConsumer (new)
 */

export { ImprovementProducer } from './improvement.producer';
export type { ImprovementJobData } from './improvement.producer';
