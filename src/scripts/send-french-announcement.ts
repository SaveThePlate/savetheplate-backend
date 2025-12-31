/**
 * Script to send a French announcement to a list of email addresses
 * 
 * Usage:
 *   ts-node src/scripts/send-french-announcement.ts
 * 
 * Make sure to set your JWT token in the AUTH_TOKEN environment variable
 * or update the TOKEN constant below.
 */

import axios from 'axios';

// Update this with your JWT token or set AUTH_TOKEN environment variable
const TOKEN = process.env.AUTH_TOKEN || 'YOUR_JWT_TOKEN_HERE';
const API_URL = process.env.API_URL || 'http://localhost:3001';

// List of email addresses to send to
const EMAIL_LIST = [
  'salemwachwacha1997@gmail.com',
  'yasminederbel002@gmail.com',
  'iskandersoussia2005@gmail.com',
  'ous26001009@gmail.com',
  'hajjiassyl@gmail.com',
  'ybaklouti15@gmail.com',
  'mohamed.cherif.khcherif@gmail.com',
  'yahyaouifatma39@gmail.com',
  'khayri.allala2018@gmail.com',
  'ibrahim.saidane77@gmail.com',
  'rimjalel999@gmail.com',
  'youssef.baizigue@outlook.fr',
  'sihemlo@gmail.com',
  'zaynebmasmoudi.tbs@gmail.com',
  'mohamed.kahlaoui1999@gmail.com',
  'ahmedcherif2024@gmail.com',
  'hadilyahiaoui02@gmail.com',
  'khalil.zammeli.az@gmail.com',
  'sami.masmoudi@etudiant-enit.utm.tn',
  'ihebchr3@gmail.com',
  'yahya.ch.chebb@gmail.com',
  'amenikardous0@gmail.com',
  'bettaieb.youssef.2003@gmail.com',
  'ranimesboui7@gmail.com',
  'khayatiwael@gmail.com',
  'misou444@gmail.com',
  'nbenjannena@gmail.com',
  'selimtellili5@gmail.com',
  'hajersoussia@gmail.com',
  'skanderkefi97@gmail.com',
  'bensalhayosra88@gmail.com',
  'fatmahammedi51@gmail.com',
  'mouhanned.j18@gmail.com',
  'lililamiss54@gmail.com',
  'hayounions11@gmail.com',
  'dhiazoueri7@gmail.com',
  'koukinabil73@gmail.com',
  'achrefbanaoues@gmail.com',
  'hmemalaa8@gmail.com',
  'youssefmouelhi555@gmail.com',
  'amir_ouasti@hotmail.fr',
  'yesmineebensalha@gmail.com',
  'yasserzrelli@yahoo.fr',
  'mariemyounes115@gmail.com',
  'yassine.saadouni.77@gmail.com',
  'chedly89@icloud.com',
  'moetazmhemdi7@gmail.com',
  'majidooucharfi@gmail.com',
  'eya.zayet2001@gmail.com',
  'sirinehachem31@gmail.com',
  'azizbr438@gmail.com',
  'harzlisiwar7@gmail.com',
  'dhia3gdara@gmail.com',
  'mehdibessrour4@gmail.com',
  'abdelmalek.abed321@gmail.com',
  'cherifcyrine67@gmail.com',
  'ayanajlaoui22@gmail.com',
  'jarrayaahmed88@gmail.com',
  'dhiazouari6@gmail.com',
  'rayanammar007@gmail.com',
  'lina.benarbi@gmail.com',
  'karramyriam@gmail.com',
  'fedilejmi1@gmail.com',
  'maroikhayaty@gmail.com',
  'khayatidali2@gmail.com',
  'imenbarnat1972@gmail.com',
  'bettaieb.ahmed.2000@gmail.com',
  'eetherfi00+20507@gmail.com',
  'fenella.dodd@gmail.com',
  'azizlaifi123@gmail.com',
  'yassermahrouk.temp@gmail.com',
  'claudiadebxl@gmail.com',
  'veronique.migom@outlook.com',
  'lombi49@gmail.com',
  'paulineponthot@hotmail.com',
  'tliliramy1@gmail.com',
  'lemmon18@hotmail.co.uk',
  'lapratg@gmail.com',
  'n.j.toussaint@skynet.be',
  'med.borgi000@gmail.com',
  'sarrasoussia2001@gmail.com',
];

// French announcement content - customize these as needed
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
  emails: EMAIL_LIST,
  language: 'fr',
  forceProduction: true, // Set to true when ready to send in production
};

async function sendAnnouncement() {
  // Use test endpoint in development (no auth required)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const endpoint = isDevelopment ? '/announcements/test' : '/announcements/send';
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  // Only add auth token if not using test endpoint
  if (!isDevelopment) {
    if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
      console.error('❌ Error: Please set AUTH_TOKEN environment variable or update TOKEN in the script');
      process.exit(1);
    }
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  console.log('📧 Sending French announcement to', EMAIL_LIST.length, 'email addresses...');
  console.log('🌐 Using endpoint:', endpoint);
  console.log('🔧 Mode:', isDevelopment ? 'Development (test endpoint)' : 'Production\n');

  try {
    const response = await axios.post(
      `${API_URL}${endpoint}`,
      FRENCH_ANNOUNCEMENT,
      { headers }
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

// Run the script
sendAnnouncement();
