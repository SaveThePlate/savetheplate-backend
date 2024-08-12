import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate
      preview="Connect to Save The Plate"
      mainTitle="Happy to see you, again!"
      //image bug here
      mainImage={`${process.env.FRONT_URL}/fullname1.png`}
      description="Just click the button below to log in."
      centeredDescription={true}
      details={[]}
      buttonText="Login"
      buttonLink={magicLink}
      withThank={true}
      withButton={true}
    />
  );
}

export default MagicLinkEmailTemplate;