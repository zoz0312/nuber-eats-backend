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

  private async sendEmail(
    subject: string,
    to: string,
    template: string,
    emailValiables: EmailVariables[],
  ) {
    const base64Encoded = Buffer.from(`api:${this.options.apiKey}`).toString('base64');
    const form = new FormData();
    form.append('from', `AJu from NuberEats <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailValiables.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));

    try {
      const response = await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`,{
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64Encoded}`,
        },
        body: form,
      });
      console.log('response', response.body);
    } catch (e) {
      console.log('mail error', e)
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'zoz0312@naver.com', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
