import { supabaseAdmin } from '../src/lib/supabase.js';
import { createNote } from '../src/services/notes.js';

const SAMPLE_NOTES = [
  {
    content: 'Had oats and banana for breakfast on Tuesday. Went for a 30-minute morning jog in the park.',
    entry_date: '2026-09-22',
  },
  {
    content: 'Worked on the AI journal project using Node.js, Express, and Supabase vector search. Everything built smoothly!',
    entry_date: '2026-09-21',
  },
  {
    content: 'Had a great dinner with family. We made homemade pizza and watched a comedy movie together.',
    entry_date: '2026-09-20',
  },
  {
    content: 'Spent the afternoon reading a book on software architecture, clean code principles, and multi-tenant system design.',
    entry_date: '2026-09-19',
  },
  {
    content: 'Felt very productive today. Finished refactoring the RAG retrieval pipeline and added rate limiting hardening.',
    entry_date: '2026-09-18',
  },
];

async function seed() {
  console.log('🌱 Starting database seed script...\n');

  let userId = process.argv[2];

  if (!userId) {
    console.log('Fetching users from Supabase Auth...');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error('❌ Failed to fetch users from Supabase:', error.message);
      process.exit(1);
    }

    if (!data.users || data.users.length === 0) {
      console.log('No users found in Supabase Auth. Auto-creating test user "alice@test.com"...');
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: 'alice@test.com',
        password: 'TestPassword123!',
        email_confirm: true,
      });

      if (createErr) {
        console.error('❌ Failed to auto-create user:', createErr.message);
        process.exit(1);
      }

      userId = newUser.user.id;
      console.log(`✅ Created user: ${newUser.user.email} (${userId})\n`);
    } else {
      userId = data.users[0].id;
      console.log(`Using existing user: ${data.users[0].email} (${userId})\n`);
    }
  } else {
    console.log(`Using provided User ID: ${userId}\n`);
  }

  // Insert sample notes using createNote service (computes embeddings & chunking)
  for (let i = 0; i < SAMPLE_NOTES.length; i++) {
    const noteData = SAMPLE_NOTES[i];
    console.log(`Seeding note ${i + 1}/${SAMPLE_NOTES.length} (${noteData.entry_date})...`);
    try {
      const created = await createNote(userId, noteData);
      console.log(`  ✅ Note ID: ${created.id}`);
    } catch (err) {
      console.error(`  ❌ Failed to create note:`, err.message || err);
    }
  }

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
