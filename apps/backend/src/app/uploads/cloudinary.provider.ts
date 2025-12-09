import { Provider } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../../config/envs';

export const CloudinaryProvider: Provider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    if (
      envs.cloudinary.cloudName &&
      envs.cloudinary.apiKey &&
      envs.cloudinary.apiSecret
    ) {
      return cloudinary.config({
        cloud_name: envs.cloudinary.cloudName,
        api_key: envs.cloudinary.apiKey,
        api_secret: envs.cloudinary.apiSecret,
        secure: true,
      });
    }
    return null;
  },
};

