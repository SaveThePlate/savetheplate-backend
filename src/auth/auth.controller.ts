import {
  Body,
  Request,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthMagicMailSenderDtoRequest, AuthMagicMailSenderDtoResponse, AuthMagicMailVerifierDtoRequest, AuthMagicMailVerifierDtoResponse, GetUserByTokenDtoResponse } from './dto/auth-request.dto';


@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  //ENDPOINT TO REGISTER USER
  @Post('/send-magic-mail')
  @ApiOkResponse({ type: AuthMagicMailSenderDtoResponse })
  Auth(@Body() AuthUserDto: AuthMagicMailSenderDtoRequest) {
    return this.authService.AuthMagicMailSender(AuthUserDto);
  }

  //ENDPOINT TO VERIFY TOKEN
  @Post('/verify-magic-mail')
  @ApiOkResponse({ type: AuthMagicMailVerifierDtoResponse })
  AuthMagicMailVerifier(@Body() AuthUserDto: AuthMagicMailVerifierDtoRequest) {
    return this.authService.AuthMagicMailVerifier(AuthUserDto);
  }

  //ENDPOINT TO GET USER BY TOKEN
  @Get('/get-user-by-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: GetUserByTokenDtoResponse })
  GetUserByToken(@Req() request: Request) {
    return this.authService.GetUserByToken(request);
  }

}