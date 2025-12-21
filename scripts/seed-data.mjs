/**
 * Script to seed sample data to Azure Cosmos DB via the API
 */

const API_URL = 'https://shaadi-partner-api.azurewebsites.net/api/kv';

const sampleData = {
  profiles: {
    id: 'profiles',
    key: 'profiles',
    data: [
      { id: 'profile-1', profileId: 'RS123497', firstName: 'Rahul', lastName: 'Sharma', fullName: 'Rahul Sharma', dateOfBirth: '1997-05-15', age: 27, gender: 'male', religion: 'Hindu', caste: 'Brahmin', community: 'North Indian', motherTongue: 'Hindi', education: 'B.Tech Computer Science', occupation: 'Software Engineer', salary: '₹12-15 LPA', location: 'Bangalore', country: 'India', maritalStatus: 'never-married', email: 'rahul@example.com', mobile: '+91 98765 11111', hideEmail: false, hideMobile: false, photos: [], bio: 'Looking for a life partner who shares similar values and interests.', height: '5\'10"', familyDetails: 'Father: Business, Mother: Homemaker, 1 younger sister', dietPreference: 'veg', drinkingHabit: 'never', smokingHabit: 'never', status: 'verified', trustLevel: 5, createdAt: new Date().toISOString(), emailVerified: true, mobileVerified: true, isBlocked: false, membershipPlan: '6-month', membershipExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'profile-2', profileId: 'PG234598', firstName: 'Priya', lastName: 'Gupta', fullName: 'Priya Gupta', dateOfBirth: '1998-08-22', age: 26, gender: 'female', religion: 'Hindu', caste: 'Vaishya', community: 'North Indian', motherTongue: 'Hindi', education: 'MBA Finance', occupation: 'Financial Analyst', salary: '₹8-10 LPA', location: 'Mumbai', country: 'India', maritalStatus: 'never-married', email: 'priya@example.com', mobile: '+91 98765 22222', hideEmail: false, hideMobile: false, photos: [], bio: 'Family-oriented person seeking a well-educated and caring partner.', height: '5\'5"', familyDetails: 'Father: Doctor, Mother: Teacher, 1 elder brother', dietPreference: 'veg', manglik: false, drinkingHabit: 'never', smokingHabit: 'never', status: 'verified', trustLevel: 5, createdAt: new Date().toISOString(), emailVerified: true, mobileVerified: true, isBlocked: false, membershipPlan: '6-month', membershipExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'profile-3', profileId: 'AK345699', firstName: 'Amit', lastName: 'Kumar', fullName: 'Amit Kumar', dateOfBirth: '1999-03-10', age: 25, gender: 'male', religion: 'Hindu', caste: 'Kshatriya', community: 'North Indian', motherTongue: 'Hindi', education: 'CA', occupation: 'Chartered Accountant', salary: '₹10-12 LPA', location: 'Delhi', country: 'India', maritalStatus: 'never-married', email: 'amit@example.com', mobile: '+91 98765 33333', hideEmail: false, hideMobile: false, photos: [], bio: 'Traditional values with modern outlook. Looking for understanding life partner.', height: '5\'8"', familyDetails: 'Father: Retired Government Officer, Mother: Homemaker', dietPreference: 'veg', manglik: false, drinkingHabit: 'occasionally', smokingHabit: 'never', status: 'verified', trustLevel: 3, createdAt: new Date().toISOString(), emailVerified: true, mobileVerified: true, isBlocked: false, membershipPlan: '1-year', membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'profile-free', profileId: 'FP999999', firstName: 'Test', lastName: 'FreePlan', fullName: 'Test FreePlan', dateOfBirth: '1996-01-15', age: 28, gender: 'male', religion: 'Hindu', caste: 'General', community: 'North Indian', motherTongue: 'Hindi', education: 'B.Com', occupation: 'Business', salary: '₹5-8 LPA', location: 'Delhi', country: 'India', maritalStatus: 'never-married', email: 'freeuser@example.com', mobile: '+91 98765 99999', hideEmail: false, hideMobile: false, photos: [], bio: 'Free plan test user for testing blur functionality.', height: '5\'8"', familyDetails: 'Test family', dietPreference: 'veg', drinkingHabit: 'never', smokingHabit: 'never', status: 'verified', trustLevel: 1, createdAt: new Date().toISOString(), emailVerified: true, mobileVerified: true, isBlocked: false, membershipPlan: 'free', membershipExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() },
    ]
  },
  users: {
    id: 'users',
    key: 'users',
    data: [
      { userId: 'USER001', password: 'pass123', profileId: 'profile-1', createdAt: new Date().toISOString() },
      { userId: 'USER002', password: 'pass456', profileId: 'profile-2', createdAt: new Date().toISOString() },
      { userId: 'USER003', password: 'pass789', profileId: 'profile-3', createdAt: new Date().toISOString() },
      { userId: 'FREEUSER', password: 'free123', profileId: 'profile-free', createdAt: new Date().toISOString() },
    ]
  },
  weddingServices: {
    id: 'weddingServices',
    key: 'weddingServices',
    data: [
      { id: 'ws-1', category: 'venue', businessName: 'Royal Garden Banquet', contactPerson: 'Rajesh Kumar', mobile: '+91 98765 43210', email: 'royalgarden@example.com', address: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', description: 'Luxurious banquet hall with capacity for 500+ guests.', priceRange: '₹2,00,000 - ₹5,00,000', verificationStatus: 'verified', createdAt: new Date().toISOString(), consultationFee: 200, rating: 4.5, reviewCount: 45 },
      { id: 'ws-2', category: 'photographer', businessName: 'Moments Photography', contactPerson: 'Priya Sharma', mobile: '+91 98765 43211', email: 'moments@example.com', address: '456 Park Street', city: 'Delhi', state: 'Delhi', description: 'Professional wedding photography and videography services.', priceRange: '₹50,000 - ₹2,00,000', verificationStatus: 'verified', createdAt: new Date().toISOString(), consultationFee: 200, rating: 4.8, reviewCount: 120 },
      { id: 'ws-3', category: 'caterer', businessName: 'Spice Garden Catering', contactPerson: 'Amit Patel', mobile: '+91 98765 43212', email: 'spicegarden@example.com', address: '789 Station Road', city: 'Ahmedabad', state: 'Gujarat', description: 'Multi-cuisine catering services specializing in vegetarian food.', priceRange: '₹500 - ₹1500 per plate', verificationStatus: 'verified', createdAt: new Date().toISOString(), consultationFee: 200, rating: 4.6, reviewCount: 80 },
      { id: 'ws-4', category: 'decorator', businessName: 'Dream Decorations', contactPerson: 'Neha Singh', mobile: '+91 98765 43213', email: 'dreamdecor@example.com', address: '321 Mall Road', city: 'Jaipur', state: 'Rajasthan', description: 'Creative wedding decorations with traditional and modern themes.', priceRange: '₹1,00,000 - ₹5,00,000', verificationStatus: 'verified', createdAt: new Date().toISOString(), consultationFee: 200, rating: 4.7, reviewCount: 65 },
      { id: 'ws-5', category: 'mehandi', businessName: 'Artistic Mehandi', contactPerson: 'Kavita Verma', mobile: '+91 98765 43214', email: 'artisticmehandi@example.com', address: '567 Gandhi Nagar', city: 'Pune', state: 'Maharashtra', description: 'Traditional and contemporary mehandi designs.', priceRange: '₹5,000 - ₹25,000', verificationStatus: 'verified', createdAt: new Date().toISOString(), consultationFee: 200, rating: 4.9, reviewCount: 150 },
    ]
  },
  contactRequests: {
    id: 'contactRequests',
    key: 'contactRequests',
    data: []
  },
  blockedProfiles: {
    id: 'blockedProfiles',
    key: 'blockedProfiles',
    data: []
  }
};

async function uploadData(key, data) {
  console.log(`Uploading ${key}...`);
  try {
    const response = await fetch(`${API_URL}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✓ ${key} uploaded successfully (${data.data.length} items)`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to upload ${key}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('Seeding sample data to Azure Cosmos DB...\n');
  
  for (const [key, data] of Object.entries(sampleData)) {
    await uploadData(key, data);
  }
  
  console.log('\n✓ All data uploaded successfully!');
}

main().catch(console.error);
