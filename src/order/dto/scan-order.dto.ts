import { IsString, IsNotEmpty } from 'class-validator';

export class ScanOrderDto {
  @IsString()
  @IsNotEmpty()
  qrCodeToken: string;
}
