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
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
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

            {details.map((detail = '', index) => (
              <Text key={index} style={detailStyle}>
                {detail}
              </Text>
            ))}
          </div>

          {withButton && (
            <div style={buttonContainerStyle}>
              <Button style={buttonStyle} href={buttonLink}>
                {buttonText}
              </Button>
            </div>
          )}

          {withThank && (
            <div style={tankStyle}>
              <Text style={smallParagraph}>
                Thank you for using our service! If you have any questions, feel free to <Link style={linkContact} href={buttonLink}>contact us</Link>.
              </Text>
            </div>
          )}
        </Container>
      </Body>
    </Html>
  );
}



// Styles

const main = {
  backgroundColor: '#f9f9f9', 
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 25px 48px',
  borderRadius: '10px', 
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
};

const heading = {
  display: 'flex',
  alignItems: 'center !important',
  width: '100%',
  justifyContent: 'start',
  paddingBottom: '20px',
  borderBottom: '1px solid #868e9a99',
};

const logo = {
  width: '40px',
  height: '40px',
  display: 'block',
  marginRight: '4px',
};

const headingText = {
  fontSize: '38px',
  lineHeight: '38px',
  margin: '0px',
  color: '#354357',
  fontWeight: '700',
};

const mainTitleContainer = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  width: '100%',
};

const mainTitleStyle = {
  margin: '0px auto 30px auto',
  fontSize: '28px',
  lineHeight: '34px',
  color: '#354357',
  fontWeight: '700',
};

const contentContainerStyle = {
  margin: '30px 0px 10px 0px',
};

const paragraph = {
  fontSize: '18px',
  lineHeight: '26px',
  color: '#354357',
};

const centeredParagraph = {
  fontSize: '18px',
  lineHeight: '26px',
  textAlign: 'center',
  color: '#354357',
};

const detailStyle = {
  fontSize: '18px',
  lineHeight: '24px',
  color: '#354357',
  marginBottom: '0px',
  fontWeight: '600',
};

const buttonContainerStyle = {
  display: 'flex',
  alignItems: 'center !important',
  justifyContent: 'center !important',
  margin: '30px 0px',
};

const buttonStyle = {
  color: '#ffffff',
  padding: '12px 24px',
  background: '#58B2A0',
  borderRadius: '8px',
  fontWeight: 'bold',
  margin: 'auto',
  textDecoration: 'none', 
};

const tankStyle = {
  width: '100%',
};

const smallParagraph = {
  fontSize: '18px',
  lineHeight: '24px',
  fontWeight: '400',
  color: '#354357',
};

const linkContact = {
  color: '#58B2A0',
  textDecoration: 'none',
  fontWeight: '400',
};

export default MainTemplate;