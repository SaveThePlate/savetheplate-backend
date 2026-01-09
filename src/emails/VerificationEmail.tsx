import * as React from 'react';
import MainTemplate from './MainTemplate';

function VerificationEmailTemplate({ verificationCode }) {
  return (
    <MainTemplate
      preview="Your verification code"
      mainTitle="Email Verification"
      description={`Your verification code is: ${verificationCode}`}
      centeredDescription={true}
      details={[
        "Enter this code in the app to verify your email.",
        "This code expires in 10 minutes."
      ]}
      buttonText=""
      buttonLink=""
      withThank={false}
      withButton={false}
    />
  );
}

export default VerificationEmailTemplate;

