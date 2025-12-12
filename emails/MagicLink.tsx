import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate
      preview="Connectez-vous à Save The Plate"
      mainTitle="Connexion à Save The Plate"
      description="Cliquez sur le bouton ci-dessous pour accéder à votre compte de manière sécurisée. Ce lien expire dans 10 minutes."
      centeredDescription={true}
      details={[]}
      buttonText="Se connecter"
      buttonLink={magicLink}
      withThank={false}
      withButton={true}
    />
  );
}

export default MagicLinkEmailTemplate;