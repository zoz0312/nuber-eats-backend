import { Test } from "@nestjs/testing";
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from "src/common/common.contants";
import { JwtService } from "./jwt.service"

const TEST_KEY = 'testKey';
const TOKEN = 'TOKEN';
const PAYLOAD = { id: 1 };

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => TOKEN),
    verify: jest.fn(() => PAYLOAD),
  }
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtService, {
        provide:  CONFIG_OPTIONS,
        useValue: { privateKey: TEST_KEY },
      }],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return sign token', async () => {
      const token = service.sign(PAYLOAD);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(PAYLOAD, TEST_KEY);
      expect(token).toEqual(TOKEN);
    });
  });

  describe('verify', () => {
    it('should return the decoded token', () => {
      const decodedToken = service.verify(TOKEN);
      expect(jwt.verify).toHaveBeenCalled();
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
      expect(decodedToken).toEqual(PAYLOAD);
    });
  });

})