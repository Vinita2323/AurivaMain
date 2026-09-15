import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

console.log('Testing connection to MongoDB Atlas...');
console.log('URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'No MONGO_URI found');

try {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 6000
  });
  console.log('-------------------------------------------');
  console.log(' SUCCESS: Connected to MongoDB Atlas!');
  console.log(` Host: ${conn.connection.host}`);
  console.log(` Database: ${conn.connection.name}`);
  console.log('-------------------------------------------');
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.log('-------------------------------------------');
  console.error(' CONNECTION FAILED:');
  console.error(err.message);
  if (err.message.includes('SSL alert number 80') || err.message.includes('whitelist') || err.message.includes('tlsv1 alert')) {
    console.log('\nDIAGNOSIS: Your IP is not whitelisted in MongoDB Atlas.');
    console.log('ACTION: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0)');
  }
  console.log('-------------------------------------------');
  process.exit(1);
}
