import * as React from 'react';
import MainTemplate from './MainTemplate';

interface ProviderRegistrationEmailProps {
  username: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  mapsLink?: string;
  userId: number;
}

function ProviderRegistrationEmail({
  username,
  email,
  phoneNumber,
  location,
  mapsLink,
  userId,
}: ProviderRegistrationEmailProps) {
  const details = [
    `Name: ${username}`,
    `Email: ${email}`,
    `Phone: ${phoneNumber || 'Not provided'}`,
    `Location: ${location || 'Not provided'}`,
    mapsLink ? `Maps Link: ${mapsLink}` : 'Maps Link: Not provided',
    `User ID: ${userId}`,
  ];

  return (
    <MainTemplate
      preview="New Provider Registration - Approval Required"
      mainTitle="🎉 New Provider Registration"
      description="A new food provider has completed their registration and is waiting for approval."
      centeredDescription={true}
      details={details}
      buttonText="View Maps Location"
      buttonLink={mapsLink || 'https://savetheplate.tn'}
      withThank={false}
      withButton={!!mapsLink}
    />
  );
}

export default ProviderRegistrationEmail;

