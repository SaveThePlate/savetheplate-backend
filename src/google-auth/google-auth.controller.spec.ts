import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthController } from './google-auth.controller';
import { beforeEach, describe, it } from 'node:test';

describe('GoogleAuthController', () => {
  let controller: GoogleAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAuthController],
    }).compile();

    controller = module.get<GoogleAuthController>(GoogleAuthController);
  });

  // it('should be defined', () => {
  //   expect(controller).toBeDefined();
  // });
});
function expect(controller: GoogleAuthController) {
  throw new Error('Function not implemented.');
}

