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
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  //generating access and refresh tokens
  const token = await jwt.signAsync(jwtPayload, {
    secret: jwtSecret,
    expiresIn: JwtExpireDateByType(type),
  });

  //returning the tokens
  return token;
};

export const DecodeToken = async (token: string): Promise<JwtPayload> => {
  const jwt = new JwtService();
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const decoded: JwtPayload = await jwt.verifyAsync(token, {
    secret: jwtSecret,
  });
  return decoded;
};

export const JustCrypt = async (text: string): Promise<string> => {
  const jwtPayload: { text: string } = {
    text: text,
  };
  const jwt = new JwtService();
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const token = await jwt.signAsync(jwtPayload, {
    secret: jwtSecret,
  });

  //returning the tokens
  return token;
};

export const JustDecrypt = async (token: string): Promise<string> => {
  const jwt = new JwtService();
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const decoded: { text: string } = await jwt.verifyAsync(token, {
    secret: jwtSecret,
  });
  return decoded.text;
};
