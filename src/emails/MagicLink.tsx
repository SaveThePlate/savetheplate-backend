import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate
      preview="Bienvenue sur SaveThePlate!"
      mainTitle="Bienvenue sur SaveThePlate! 🎉"
      description="Rejoignez-nous pour réduire le gaspillage alimentaire et sauver la planète, un repas à la fois 🌍"
      centeredDescription={true}
      details={[]}
      buttonText="Se connecter avec l'email"
      buttonLink={magicLink}
      withThank={false}
      withButton={true}
    />
  );
}

export default MagicLinkEmailTemplate;