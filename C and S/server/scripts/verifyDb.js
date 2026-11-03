import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function verify() {
  console.log('Connecting to MongoDB Atlas at:', process.env.MONGODB_URI ? 'URI present' : 'URI missing');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database Host:', mongoose.connection.host);
  console.log('Database Name:', mongoose.connection.name);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nCollections and Document Counts:');
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(` - ${c.name}: ${count} document(s)`);
  }
  await mongoose.disconnect();
  console.log('\nVerification complete!');
}

verify().catch(console.error);
