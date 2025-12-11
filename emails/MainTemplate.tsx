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
        </Container>
      </Body>
    </Html>
  );
}



// Styles

const main = {
  backgroundColor: '#0a0e27',
  background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 30%, #2a2f4a 60%, #1a1f3a 100%)',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  padding: '30px 0',
};

const container = {
  margin: '0 auto',
  padding: '50px 45px',
  borderRadius: '25px',
  background: '#ffffff',
  boxShadow: '0 25px 80px rgba(88, 178, 160, 0.15), 0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
  maxWidth: '800px',
  width: '100%',
  position: 'relative' as const,
  overflow: 'hidden',
  border: '1px solid rgba(88, 178, 160, 0.2)',
};

const heading = {
  display: 'flex',
  alignItems: 'center !important',
  width: '100%',
  justifyContent: 'center',
  paddingBottom: '30px',
  borderBottom: '4px solid',
  borderImage: 'linear-gradient(90deg, #58B2A0 0%, #7DD3C0 25%, #FFD93D 50%, #7DD3C0 75%, #58B2A0 100%) 1',
  marginBottom: '35px',
  position: 'relative' as const,
};

const logo = {
  width: '40px',
  height: '40px',
  display: 'block',
  marginRight: '4px',
};

const headingText = {
  fontSize: '48px',
  lineHeight: '48px',
  margin: '0px',
  background: 'linear-gradient(135deg, #58B2A0 0%, #7DD3C0 30%, #FFD93D 60%, #7DD3C0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: '900',
  letterSpacing: '-2px',
  textTransform: 'uppercase',
  textShadow: '0 0 30px rgba(88, 178, 160, 0.3)',
};

const mainTitleContainer = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  width: '100%',
  marginBottom: '25px',
};

const mainTitleStyle = {
  margin: '0px auto',
  fontSize: '36px',
  lineHeight: '44px',
  background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: '900',
  textAlign: 'center' as const,
  letterSpacing: '-1px',
  padding: '0 10px',
};

const contentContainerStyle = {
  margin: '40px 0px 25px 0px',
  padding: '30px',
  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 50%, #e2e8f0 100%)',
  borderRadius: '20px',
  border: '3px solid',
  borderImage: 'linear-gradient(135deg, rgba(88, 178, 160, 0.3) 0%, rgba(125, 211, 192, 0.3) 50%, rgba(88, 178, 160, 0.3) 100%) 1',
  boxShadow: 'inset 0 2px 10px rgba(88, 178, 160, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)',
};

const paragraph = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#2d3748',
  marginBottom: '15px',
};

const centeredParagraph = {
  fontSize: '20px',
  lineHeight: '32px',
  textAlign: 'center' as const,
  color: '#1a202c',
  marginBottom: '20px',
  fontWeight: '600',
  letterSpacing: '0.2px',
};

const detailStyle = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#2d3748',
  marginBottom: '16px',
  fontWeight: '600',
  paddingLeft: '8px',
};

const buttonContainerStyle = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  margin: '35px 0px',
};

const buttonStyle = {
  color: '#ffffff',
  padding: '18px 45px',
  background: 'linear-gradient(135deg, #58B2A0 0%, #7DD3C0 40%, #FFD93D 60%, #7DD3C0 100%)',
  backgroundSize: '200% 200%',
  borderRadius: '50px',
  fontWeight: '800',
  margin: 'auto',
  textDecoration: 'none',
  fontSize: '19px',
  boxShadow: '0 10px 30px rgba(88, 178, 160, 0.5), 0 5px 15px rgba(255, 217, 61, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  transition: 'all 0.3s ease',
  display: 'inline-block',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
};

const tankStyle = {
  width: '100%',
  marginTop: '30px',
  paddingTop: '25px',
  borderTop: '2px dashed #e2e8f0',
};

const smallParagraph = {
  fontSize: '17px',
  lineHeight: '26px',
  fontWeight: '500',
  color: '#4a5568',
  textAlign: 'center' as const,
  letterSpacing: '0.1px',
};

const linkContact = {
  color: '#58B2A0',
  textDecoration: 'none',
  fontWeight: '700',
  borderBottom: '2px solid #58B2A0',
  paddingBottom: '2px',
  background: 'linear-gradient(135deg, rgba(88, 178, 160, 0.1) 0%, rgba(125, 211, 192, 0.1) 100%)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const accentBar = {
  position: 'absolute' as const,
  top: '0',
  left: '0',
  right: '0',
  height: '6px',
  background: 'linear-gradient(90deg, #58B2A0 0%, #7DD3C0 20%, #FFD93D 40%, #FF6B6B 60%, #FFD93D 80%, #7DD3C0 100%)',
  borderRadius: '25px 25px 0 0',
  boxShadow: '0 2px 10px rgba(88, 178, 160, 0.4)',
};


export default MainTemplate;