import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.contants';
import { EmailVariables, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor (
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
  ) {
    // this.sendVerificationEmail('code', 'UserName');
  }

  async sendEmail(
    subject: string,
    to: string,
    template: string,
    emailValiables: EmailVariables[],
  ): Promise<Boolean> {
    /* TODO: mail server 열어서 mailgun과 동기화 시키기
      후에 "to" User에게 전송
    */
    const base64Encoded = Buffer.from(`api:${this.options.apiKey}`).toString('base64');
    const form = new FormData();
    form.append('from', `AJu from NuberEats <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailValiables.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));

    try {
      await got.post(`https://api.mailgun.net/v3/${this.options.domain}/messages`,{
        headers: {
          Authorization: `Basic ${base64Encoded}`,
        },
        body: form,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'zoz0312@naver.com', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
