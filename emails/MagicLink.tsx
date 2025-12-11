import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate
      preview="Welcome back to Save The Plate! 🍽️"
      mainTitle="🌟 Welcome Back!"
      description="We're thrilled to have you back! Click the button below to securely log in to your account and continue your journey with us."
      centeredDescription={true}
      details={[]}
      buttonText="Log In to Your Account"
      buttonLink={magicLink}
      withThank={true}
      withButton={true}
    />
  );
}

export default MagicLinkEmailTemplate;