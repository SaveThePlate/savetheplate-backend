import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <Html>
      <Head />
      <Preview>Log in to Save The Plate</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Click the button below to log in:</Text>
          <Button style={button} href={magicLink}>
            Log In
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  padding: '20px',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#58B2A0',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'block',
  textAlign: 'center' as const,
  margin: '0 auto',
};

export default MagicLinkEmailTemplate;