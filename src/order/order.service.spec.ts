import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { OfferService } from '../offer/offer.service';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { CacheService } from '../cache/cache.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const mockPrismaService = {};
    const mockOfferService = {};
    const mockWebSocketGateway = {};
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OfferService,
          useValue: mockOfferService,
        },
        {
          provide: AppWebSocketGateway,
          useValue: mockWebSocketGateway,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
