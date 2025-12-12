import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate
      preview="Connectez-vous à Save The Plate en un clic ! 🚀"
      mainTitle="Bonjour ! 👋"
      description="Cliquez sur le bouton ci-dessous pour vous connecter de manière sécurisée à votre compte. C'est rapide, simple et sans mot de passe !"
      centeredDescription={true}
      details={[
        '✨ Connexion instantanée en un seul clic',
        '🔒 Sécurisé et sans mot de passe',
        '⏱️ Ce lien expire dans 10 minutes'
      ]}
      buttonText="Se connecter"
      buttonLink={magicLink}
      withThank={true}
      withButton={true}
    />
  );
}

export default MagicLinkEmailTemplate;