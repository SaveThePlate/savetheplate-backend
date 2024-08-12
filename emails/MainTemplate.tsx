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
    preview = '',
    mainTitle = '',
    mainImage = '',
    description = '',
    centeredDescription = false,
    details = [],
    buttonText = '',
    buttonLink = '',
    withThank = false,
    withButton = true,
  }) {
    return (
      <Html>
        <Head />
        <Preview>{preview}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Heading style={heading}>
            {/* //image bug here */}
              <Img src={mainImage} alt="SaveThePlate Logo" style={logo} />
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
                return (
                  <Text key={index} style={detailStyle}>
                    {detail}
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
              <div style={tankStyle}>
                <Text style={smallParagraph}>Please, don't hesitate to contact us in case of any issue.</Text>
              </div>
            )}
  
            
            
          </Container>
        </Body>
      </Html>
    );
  }
  
  export default MainTemplate;
  
  const main = {
    backgroundColor: '#ffffff',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  };
  
  const container = {
    margin: '0 auto',
    padding: '20px 25px 48px',
  };
  
  // Header styles
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
  
  // Main title styles
  const mainTitleContainer = {
    display: 'flex',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    with: '100%',
  };
  
  const mainTitleStyle = {
    margin: '0px auto 30px auto',
    fontSize: '28px',
    lineHeight: '34px',
    color: '#354357',
    fontWeight: '700',
  };
  
  // Main image styles
  const ImageContainer = {
    display: 'flex',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    height: '150px',
  };
  
  const mainImageStyle = {
    height: '150px',
    display: 'block',
    margin: 'auto',
  };
  
  // Content styles
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
    lineHeight: '14px',
    color: '#354357',
    marginBottom: '0px',
    fontWeight: '600',
  };
  
  // Button styles
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
  };
  
  // Tank styles
  
  const tankStyle = {
    width: '100%',
  };
  
  const smallParagraph = {
    fontSize: '18px',
    lineHeight: '8px',
    fontWeight: '400',
    color: '#354357',
  };
  
  const ifErrorText = {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '400',
    color: '#76808d',
  };
  
  const linkContact = {
    color: '#58B2A0',
    textDecoration: 'none',
    fontWeight: '400',
  };
  
  const dateHidden = {
    color: '#8898aa',
    marginTop: '-5px',
    fontHeight: '0px',
  };