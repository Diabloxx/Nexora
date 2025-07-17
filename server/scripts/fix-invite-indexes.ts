import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixInviteIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const serversCollection = db.collection('servers');

    // List current indexes
    console.log('Current indexes:');
    const indexes = await serversCollection.indexes();
    console.log(indexes);

    // Drop the problematic invite code index
    try {
      await serversCollection.dropIndex('invites.code_1');
      console.log('Dropped invites.code_1 index');
    } catch (error) {
      console.log('Index invites.code_1 may not exist:', error.message);
    }

    // Create a sparse index for invite codes (only indexes non-null values)
    await serversCollection.createIndex(
      { 'invites.code': 1 }, 
      { unique: true, sparse: true, name: 'invites_code_sparse' }
    );
    console.log('Created sparse index for invite codes');

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixInviteIndexes();
