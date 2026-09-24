import { embedQuery } from '../src/services/embeddings.js';
import { chat } from '../src/services/llm.js';

async function main() {
  console.log('Testing embedQuery("hello")...');
  const vector = await embedQuery('hello');
  console.log('✅ Vector generated successfully!');
  console.log(`Vector dimension (length): ${vector.length}`);

  console.log('\nTesting chat() with a short question...');
  const response = await chat({
    messages: [
      { role: 'user', content: 'Say "Hello, world!" and name your model.' },
    ],
  });
  console.log('✅ Chat response received:');
  console.log(response.choices[0]?.message?.content);
}

main().catch((err) => {
  console.error('❌ Error during check:', err);
  process.exit(1);
});
