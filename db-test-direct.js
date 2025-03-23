// Direct database connection test
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Starting direct database test...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Check available collections in the database
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Try to query the users collection directly
      if (collections.some(c => c.name === 'users')) {
        console.log('Users collection found, querying...');
        
        const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
        console.log(`Found ${users.length} users`);
        
        // Print user details
        if (users.length > 0) {
          console.log('Sample users:');
          users.forEach(user => {
            console.log(`  - ID: ${user._id}, Name: ${user.name || '(no name)'}, Email: ${user.email || '(no email)'}`);
          });
          
          // Find users with 'Abhi' in name
          const abhiUsers = await mongoose.connection.db.collection('users').find({
            $or: [
              { name: /abhi/i },
              { email: /abhi/i }
            ]
          }).toArray();
          
          console.log(`\nFound ${abhiUsers.length} users matching 'Abhi':`);
          abhiUsers.forEach(user => {
            console.log(`  - ID: ${user._id}, Name: ${user.name || '(no name)'}, Email: ${user.email || '(no email)'}`);
          });
        } else {
          console.log('No users found in the collection');
        }
      } else {
        console.log('Users collection not found!');
        console.log('Available collections:', collections.map(c => c.name).join(', '));
      }
    } catch (err) {
      console.error('Error querying database:', err);
    } finally {
      // Close the connection
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 