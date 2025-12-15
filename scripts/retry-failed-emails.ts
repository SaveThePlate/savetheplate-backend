/**
 * Script to retry sending to failed email addresses
 * 
 * Usage:
 *   npx ts-node scripts/retry-failed-emails.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Last remaining failed email
const FAILED_EMAILS = [
  'bettaieb.ahmed.2000@gmail.com',
];

const FRENCH_ANNOUNCEMENT = {
  subject: '🎉 Des nouvelles excitantes de Save The Plate !',
  title: '🎉 Des nouvelles excitantes de Save The Plate !',
  description: 'Préparez-vous ! Save The Plate arrive bientôt. Créez votre compte dès maintenant et soyez parmi les premiers à découvrir des offres alimentaires incroyables, économisez de l\'argent tout en réduisant le gaspillage !',
  details: [
    '🔥 Soyez le premier à accéder à des offres exclusives',
    '⚡ Découvrez des offres alimentaires incroyables près de chez vous',
    '💫 Aidez à réduire le gaspillage alimentaire dans votre communauté',
    '🚀 Rejoignez un mouvement pour un avenir plus durable',
  ],
  buttonText: 'Créer votre compte maintenant',
  buttonLink: 'https://leftover.ccdev.space/',
  emails: FAILED_EMAILS,
  language: 'fr',
  forceProduction: true,
};

async function retryFailedEmails() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const endpoint = isDevelopment ? '/announcements/test' : '/announcements/send';
  
  console.log('📧 Retrying failed emails...');
  console.log('📊 Total failed emails:', FAILED_EMAILS.length);
  console.log('⏳ Waiting 30 seconds for rate limit to reset...\n');
  
  // Wait 30 seconds for rate limit to reset
  await new Promise(resolve => setTimeout(resolve, 30000));

  try {
    const response = await axios.post(
      `${API_URL}${endpoint}`,
      FRENCH_ANNOUNCEMENT,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('✅ Success!');
    console.log('📊 Results:', JSON.stringify(response.data, null, 2));
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      response.data.errors.forEach((error: string) => console.log('  -', error));
    }
  } catch (error: any) {
    console.error('❌ Error sending announcement:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

retryFailedEmails();
