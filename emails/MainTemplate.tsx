import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Img,
  Link,
} from '@react-email/components';
import * as React from 'react';

function MainTemplate({
  preview = 'Your magic link to access your account',
  mainTitle = '🎉 Welcome to Save The Plate!',
  description = 'We are excited to have you join us! Click the button below to log in using your magic link.',
  centeredDescription = true,
  details = [],
  buttonText = 'Access Your Account',
  buttonLink = '',
  withThank = true,
  withButton = true,
  language = 'en',
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={accentBar}></div>
          <Heading style={heading}>
            {/* <Img src={mainImage} alt="Save The Plate Logo" style={logo} /> */}
            <Text style={headingText}>Save The Plate</Text>
          </Heading>

          <div style={mainTitleContainer}>
            <Text style={mainTitleStyle}>{mainTitle}</Text>
          </div>

          <div style={contentContainerStyle}>
            <Text style={centeredDescription ? centeredParagraph : paragraph}>
              {description}
            </Text>

            {details.map((detail = '', index) => {
              const emojis = ['🔥', '⚡', '💫', '🚀', '✨', '⭐', '🎯', '💎'];
              const emoji = emojis[index % emojis.length];
              return (
                <Text key={index} style={detailStyle}>
                  {emoji} {detail}
                </Text>
              );
            })}
          </div>

          {withButton && (
            <div style={buttonContainerStyle}>
              <Button style={buttonStyle} href={buttonLink}>
                {buttonText}
              </Button>
            </div>
          )}

          {withThank && (
            <div style={footerContainerStyle}>
              <Text style={footerText}>
                Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email en toute sécurité.
              </Text>
              <Text style={footerSmallText}>
                Merci de faire partie de la communauté Save The Plate ! 🌱
              </Text>
            </div>
          )}
        </Container>
      </Body>
    </Html>
  );
}



// Styles - Matching frontend design system

const main = {
  backgroundColor: '#F9FAF5',
  background: 'linear-gradient(135deg, #F9FAF5 0%, #F0F7F4 50%, #E8F4EE 100%)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 20px',
};

const container = {
  margin: '0 auto',
  padding: '48px 40px',
  borderRadius: '24px',
  background: '#ffffff',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
  width: '100%',
  position: 'relative' as const,
  overflow: 'hidden',
  border: '1px solid rgba(229, 231, 235, 0.8)',
};

const heading = {
  display: 'flex',
  alignItems: 'center !important',
  width: '100%',
  justifyContent: 'center',
  paddingBottom: '24px',
  borderBottom: '2px solid #E5E7EB',
  marginBottom: '32px',
  position: 'relative' as const,
};

const logo = {
  width: '40px',
  height: '40px',
  display: 'block',
  marginRight: '4px',
};

const headingText = {
  fontSize: '32px',
  lineHeight: '40px',
  margin: '0px',
  color: '#059669',
  fontWeight: '800',
  letterSpacing: '-0.5px',
  textAlign: 'center' as const,
};

const mainTitleContainer = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  width: '100%',
  marginBottom: '24px',
};

const mainTitleStyle = {
  margin: '0px auto',
  fontSize: '28px',
  lineHeight: '36px',
  color: '#1B4332',
  fontWeight: '700',
  textAlign: 'center' as const,
  letterSpacing: '-0.3px',
  padding: '0 10px',
};

const contentContainerStyle = {
  margin: '32px 0px 24px 0px',
  padding: '32px 28px',
  background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #D1FAE5 100%)',
  borderRadius: '16px',
  border: '2px solid #A7F3D0',
  boxShadow: 'inset 0 1px 3px rgba(5, 150, 105, 0.08)',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '12px',
};

const centeredParagraph = {
  fontSize: '17px',
  lineHeight: '26px',
  textAlign: 'center' as const,
  color: '#1F2937',
  marginBottom: '16px',
  fontWeight: '500',
  letterSpacing: '0.1px',
};

const detailStyle = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '12px',
  fontWeight: '500',
  paddingLeft: '8px',
};

const buttonContainerStyle = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  margin: '32px 0px',
};

const buttonStyle = {
  color: '#ffffff',
  padding: '16px 32px',
  background: '#059669',
  borderRadius: '12px',
  fontWeight: '700',
  margin: 'auto',
  textDecoration: 'none',
  fontSize: '16px',
  boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3), 0 2px 4px rgba(5, 150, 105, 0.2)',
  display: 'inline-block',
  letterSpacing: '0.3px',
  border: 'none',
};

const tankStyle = {
  width: '100%',
  marginTop: '30px',
  paddingTop: '25px',
  borderTop: '2px dashed #E5E7EB',
};

const smallParagraph = {
  fontSize: '15px',
  lineHeight: '22px',
  fontWeight: '400',
  color: '#6B7280',
  textAlign: 'center' as const,
  letterSpacing: '0.1px',
};

const linkContact = {
  color: '#059669',
  textDecoration: 'none',
  fontWeight: '600',
  borderBottom: '1px solid #059669',
  paddingBottom: '1px',
};

const accentBar = {
  position: 'absolute' as const,
  top: '0',
  left: '0',
  right: '0',
  height: '4px',
  background: 'linear-gradient(90deg, #059669 0%, #10B981 50%, #059669 100%)',
  borderRadius: '24px 24px 0 0',
};

const footerContainerStyle = {
  marginTop: '40px',
  paddingTop: '24px',
  borderTop: '1px solid #E5E7EB',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6B7280',
  marginBottom: '12px',
  fontWeight: '400',
};

const footerSmallText = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#9CA3AF',
  marginTop: '8px',
  fontWeight: '400',
};


export default MainTemplate;