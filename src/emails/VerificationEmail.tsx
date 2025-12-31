import * as React from 'react';
import MainTemplate from './MainTemplate';

function VerificationEmailTemplate({ verificationLink, verificationCode }) {
  const details = [
    "Une fois votre email vérifié, vous pourrez profiter de toutes les fonctionnalités de SaveThePlate",
  ];

  // Add verification code to details if provided
  if (verificationCode) {
    details.unshift(`Votre code de vérification est: ${verificationCode}`);
  }

  return (
    <MainTemplate
      preview="Vérifiez votre adresse email"
      mainTitle="Vérifiez votre adresse email 📧"
      description="Merci de vous être inscrit sur SaveThePlate! Utilisez le code ci-dessous ou cliquez sur le bouton pour vérifier votre adresse email et activer votre compte."
      centeredDescription={true}
      details={details}
      buttonText="Vérifier mon email"
      buttonLink={verificationLink}
      withThank={false}
      withButton={true}
    />
  );
}

export default VerificationEmailTemplate;

