import * as React from 'react';
import MainTemplate from './MainTemplate';

function AnnouncementEmailTemplate({ 
  title = '🎉 Exciting News from Save The Plate!',
  description = 'We have some amazing updates to share with you!',
  details = [],
  buttonText = 'Create Account Now',
  buttonLink = 'https://leftover.ccdev.space/',
  language = 'en',
}) {
  return (
    <MainTemplate
      preview={title}
      mainTitle={title}
      description={description}
      centeredDescription={true}
      details={details}
      buttonText={buttonText}
      buttonLink={buttonLink}
      withThank={false}
      withButton={buttonLink ? true : false}
      language={language}
    />
  );
}

export default AnnouncementEmailTemplate;
