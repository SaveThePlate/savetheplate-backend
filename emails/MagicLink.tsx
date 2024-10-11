import * as React from 'react';
import MainTemplate from './MainTemplate';

function MagicLinkEmailTemplate({ magicLink }) {
  return (
    <MainTemplate buttonLink={magicLink} />
  );
}

export default MagicLinkEmailTemplate;