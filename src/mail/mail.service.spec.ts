import { Test } from "@nestjs/testing";
import { CONFIG_OPTIONS } from "src/common/common.contants";
import { MailService } from "./mail.service";
import got from 'got';
import * as FormData from 'form-data';

jest.mock('got');
jest.mock('form-data');

const TEST = {
  DOMAIN: 'domain',
  API_KEY: 'apiKey',
  FROM_EMAIL: 'fromEmail'
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MailService, {
        provide: CONFIG_OPTIONS,
        useValue: {
          apiKey: TEST.API_KEY,
          domain: TEST.DOMAIN,
        }
      }],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  })

  describe('sendEmail', () => {
    it('sends email', async () => {
      const result = await service.sendEmail('', '', '', [{ key: 'one', value: '1' }]);
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalled();
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST.DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(result).toEqual(true);
    });
    it('should be fail errors', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const result = await service.sendEmail('', '', '', []);
      expect(result).toEqual(false);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', async () => {
      const sendVerificationEmailArgs = {
        email: 'email',
        code: 'code',
      };
      jest.spyOn(service, 'sendEmail')
        .mockImplementation(async () => { return true; });
      // service.sendEmail = jest.fn();
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalled();
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'zoz0312@naver.com',
        'verify-email',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ]
      );
    });
  });
})