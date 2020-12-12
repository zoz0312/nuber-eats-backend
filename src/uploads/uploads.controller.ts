import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import * as AWS from 'aws-sdk';

const BUCKET_NAME = 'numbereats';
const AWS_URL = `https://${BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com`;

@Controller('uploads')
export class UploadController {
  constructor(private readonly configService: ConfigService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    AWS.config.update({
      credentials: {
        accessKeyId: this.configService.get('ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('SECRET_ACCESS_KEY'),
      }
    });
    try {
      const objectName = `${Date.now()}_${file.originalname}`;
      await new AWS.S3()
      .putObject({
        Body: file.buffer,
        Bucket: BUCKET_NAME,
        Key: objectName,
        ACL: 'public-read'
      }).promise();
      const fileUrl = `${AWS_URL}/${objectName}`;
      return {
        url: fileUrl
      };
    } catch(e) {
      console.log('e',e)
      return null;
    }
  }
}