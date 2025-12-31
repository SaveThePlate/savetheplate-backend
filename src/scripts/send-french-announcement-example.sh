#!/bin/bash

# Example script to send French announcement using curl
# 
# Usage:
#   chmod +x scripts/send-french-announcement-example.sh
#   ./scripts/send-french-announcement-example.sh
#
# Or with custom token:
#   AUTH_TOKEN=your_token_here ./scripts/send-french-announcement-example.sh

API_URL="${API_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-YOUR_JWT_TOKEN_HERE}"

# Use test endpoint in development (no auth required)
if [ "$NODE_ENV" != "production" ]; then
  ENDPOINT="/announcements/test"
  AUTH_HEADER=""
  echo "🔧 Using test endpoint (development mode)"
else
  ENDPOINT="/announcements/send"
  AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"
  echo "🔧 Using production endpoint"
fi

curl -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
  -d '{
    "subject": "🎉 Des nouvelles excitantes de Save The Plate !",
    "title": "🎉 Des nouvelles excitantes de Save The Plate !",
    "description": "Préparez-vous ! Save The Plate arrive bientôt. Créez votre compte dès maintenant et soyez parmi les premiers à découvrir des offres alimentaires incroyables, économisez de l'\''argent tout en réduisant le gaspillage !",
    "details": [
      "🔥 Soyez le premier à accéder à des offres exclusives",
      "⚡ Découvrez des offres alimentaires incroyables près de chez vous",
      "💫 Aidez à réduire le gaspillage alimentaire dans votre communauté",
      "🚀 Rejoignez un mouvement pour un avenir plus durable"
    ],
    "buttonText": "Créer votre compte maintenant",
    "buttonLink": "https://leftover.ccdev.space/",
    "emails": [
      "salemwachwacha1997@gmail.com",
      "yasminederbel002@gmail.com",
      "iskandersoussia2005@gmail.com",
      "ous26001009@gmail.com",
      "hajjiassyl@gmail.com",
      "ybaklouti15@gmail.com",
      "mohamed.cherif.khcherif@gmail.com",
      "yahyaouifatma39@gmail.com",
      "khayri.allala2018@gmail.com",
      "ibrahim.saidane77@gmail.com",
      "rimjalel999@gmail.com",
      "youssef.baizigue@outlook.fr",
      "sihemlo@gmail.com",
      "zaynebmasmoudi.tbs@gmail.com",
      "mohamed.kahlaoui1999@gmail.com",
      "ahmedcherif2024@gmail.com",
      "hadilyahiaoui02@gmail.com",
      "khalil.zammeli.az@gmail.com",
      "sami.masmoudi@etudiant-enit.utm.tn",
      "ihebchr3@gmail.com",
      "yahya.ch.chebb@gmail.com",
      "amenikardous0@gmail.com",
      "bettaieb.youssef.2003@gmail.com",
      "ranimesboui7@gmail.com",
      "khayatiwael@gmail.com",
      "misou444@gmail.com",
      "nbenjannena@gmail.com",
      "selimtellili5@gmail.com",
      "hajersoussia@gmail.com",
      "skanderkefi97@gmail.com",
      "bensalhayosra88@gmail.com",
      "fatmahammedi51@gmail.com",
      "mouhanned.j18@gmail.com",
      "lililamiss54@gmail.com",
      "hayounions11@gmail.com",
      "dhiazoueri7@gmail.com",
      "koukinabil73@gmail.com",
      "achrefbanaoues@gmail.com",
      "hmemalaa8@gmail.com",
      "youssefmouelhi555@gmail.com",
      "amir_ouasti@hotmail.fr",
      "yesmineebensalha@gmail.com",
      "yasserzrelli@yahoo.fr",
      "mariemyounes115@gmail.com",
      "yassine.saadouni.77@gmail.com",
      "chedly89@icloud.com",
      "moetazmhemdi7@gmail.com",
      "majidooucharfi@gmail.com",
      "eya.zayet2001@gmail.com",
      "sirinehachem31@gmail.com",
      "azizbr438@gmail.com",
      "harzlisiwar7@gmail.com",
      "dhia3gdara@gmail.com",
      "mehdibessrour4@gmail.com",
      "abdelmalek.abed321@gmail.com",
      "cherifcyrine67@gmail.com",
      "ayanajlaoui22@gmail.com",
      "jarrayaahmed88@gmail.com",
      "dhiazouari6@gmail.com",
      "rayanammar007@gmail.com",
      "lina.benarbi@gmail.com",
      "karramyriam@gmail.com",
      "fedilejmi1@gmail.com",
      "maroikhayaty@gmail.com",
      "khayatidali2@gmail.com",
      "imenbarnat1972@gmail.com",
      "bettaieb.ahmed.2000@gmail.com",
      "eetherfi00+20507@gmail.com",
      "fenella.dodd@gmail.com",
      "azizlaifi123@gmail.com",
      "yassermahrouk.temp@gmail.com",
      "claudiadebxl@gmail.com",
      "veronique.migom@outlook.com",
      "lombi49@gmail.com",
      "paulineponthot@hotmail.com",
      "tliliramy1@gmail.com",
      "lemmon18@hotmail.co.uk",
      "lapratg@gmail.com",
      "n.j.toussaint@skynet.be",
      "med.borgi000@gmail.com",
      "sarrasoussia2001@gmail.com"
    ],
    "language": "fr",
    "forceProduction": false
  }'
