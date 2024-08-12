import { JwtService } from '@nestjs/jwt';

export enum JwtType {
  EmailToken,
  NormalToken,
  RefreshToken,
}

export interface JwtPayload {
  id: string;
  email: string;
  type: JwtType; // email-token / normal-token / refresh-token
}

const JwtExpireDateByType = (type: JwtType): string => {
  switch (type) {
    case JwtType.EmailToken:
      return '30m';
    case JwtType.NormalToken:
      return '720h';
    case JwtType.RefreshToken:
      return '720h';
    default:
      return '10m';
  }
  return '';
};

/**
 *
 * @param userId
 * @param email
 * @param type
 * @returns SIGNED ACCESS , REFRESH AND MAIL TOKEN
 */
export const generateToken = async (
  userId: string,
  email: string,
  type: JwtType,
): Promise<string> => {
  //payload to be encoded in the token
  const jwtPayload: JwtPayload = {
    id: userId,
    email: email,
    type: type,
  };
  const jwt = new JwtService();
  //generating access and refresh tokens
  const token = await jwt.signAsync(jwtPayload, {
    // secret: process.env.JWT_SECRET,
    secret: 'INVOICEakf95Dkz78Ld49',
    expiresIn: JwtExpireDateByType(type),
  });

  //returning the tokens
  return token;
};

export const DecodeToken = async (token: string): Promise<JwtPayload> => {
  const jwt = new JwtService();
  const decoded: JwtPayload = await jwt.verifyAsync(token, {
    // secret: process.env.JWT_SECRET,
    secret: 'INVOICEakf95Dkz78Ld49',
  });
  return decoded;
};

export const JustCrypt = async (text: string): Promise<string> => {
  const jwtPayload: { text: string } = {
    text: text,
  };
  const jwt = new JwtService();
  const token = await jwt.signAsync(jwtPayload, {
    secret: 'INVOICEakf95Dkz78Ld49',
  });

  //returning the tokens
  return token;
};

export const JustDecrypt = async (token: string): Promise<string> => {
  const jwt = new JwtService();
  const decoded: { text: string } = await jwt.verifyAsync(token, {
    // secret: process.env.JWT_SECRET,
    secret: 'INVOICEakf95Dkz78Ld49',
  });
  return decoded.text;
};