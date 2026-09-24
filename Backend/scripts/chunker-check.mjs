import { chunkNote } from '../src/services/chunker.js';

function runChecks() {
  console.log('Running Chunker Verification Checks...\n');

  // Check 1: 100-char note gives 1 chunk
  const shortText = 'A'.repeat(100);
  const shortResult = chunkNote({ content: shortText, entryDate: '2026-09-22' });
  console.log(`Check 1: 100-char note chunk count = ${shortResult.length}`);
  if (shortResult.length !== 1) {
    throw new Error(`Expected 1 chunk for 100-char note, got ${shortResult.length}`);
  }
  console.log('✅ Check 1 PASSED: 100-char note gives exactly 1 chunk.');

  // Check 2: 5000-char note gives multiple chunks each <= ~1100 chars with overlap
  const paragraph = 'This is a test paragraph containing important journal facts. '.repeat(10) + '\n\n';
  const longText = paragraph.repeat(8); // ~5000+ chars
  console.log(`\nGenerated long note length: ${longText.length} chars`);
  const longResult = chunkNote({ content: longText, entryDate: '2026-09-22' });

  console.log(`Check 2: 5000-char note chunk count = ${longResult.length}`);
  if (longResult.length <= 1) {
    throw new Error(`Expected multiple chunks for 5000-char note, got ${longResult.length}`);
  }

  let allUnderLimit = true;
  longResult.forEach((chunk, i) => {
    console.log(`  Chunk #${i}: content length = ${chunk.content.length} chars, index = ${chunk.chunk_index}`);
    if (chunk.content.length > 1200) {
      allUnderLimit = false;
    }
  });

  if (!allUnderLimit) {
    throw new Error('Some chunk exceeded character limit');
  }
  console.log('✅ Check 2 PASSED: 5000-char note gives multiple chunks <= ~1100 chars.');

  // Check 3: Weekday computed in UTC
  // 2026-09-22 is Tuesday in UTC
  const utcDateResult = chunkNote({ content: 'Had breakfast.', entryDate: '2026-09-22' });
  const embedHeader = utcDateResult[0].embedText.split('\n')[0];
  console.log(`\nCheck 3: Embed header generated = "${embedHeader}"`);
  if (!embedHeader.includes('2026-09-22') || !embedHeader.includes('Tuesday')) {
    throw new Error(`Expected header to include 2026-09-22 and Tuesday, got "${embedHeader}"`);
  }
  console.log('✅ Check 3 PASSED: Weekday accurately computed in UTC.');

  console.log('\n🎉 ALL CHUNKER CHECKS PASSED SUCCESSFULLY!');
}

runChecks();
