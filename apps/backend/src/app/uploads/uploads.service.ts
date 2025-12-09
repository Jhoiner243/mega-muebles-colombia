import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
  type ConfigOptions,
} from 'cloudinary';
import { Readable } from 'stream';

export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(@Inject('CLOUDINARY') private cloudinaryConfig: ConfigOptions) {
    if (!cloudinaryConfig) {
      this.logger.warn(
        'Cloudinary not configured. Image uploads will not work.'
      );
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'products',
    options?: {
      transformation?: any[];
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
    }
  ): Promise<UploadImageResult> {
    if (!this.cloudinaryConfig) {
      throw new BadRequestException('Cloudinary no está configurado');
    }

    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)'
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'El archivo es demasiado grande. El tamaño máximo es 10MB'
      );
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `mega-muebles/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          {
            quality: options?.quality || 'auto',
            fetch_format: options?.format || 'auto',
          },
        ],
      };

      // Agregar dimensiones si se especifican
      if (options?.width || options?.height) {
        uploadOptions.transformation.push({
          width: options.width,
          height: options.height,
          crop: 'limit',
        });
      }

      // Agregar transformaciones personalizadas
      if (options?.transformation) {
        uploadOptions.transformation.push(...options.transformation);
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined
        ) => {
          if (error) {
            this.logger.error('Error uploading to Cloudinary:', error);
            reject(
              new BadRequestException(
                `Error al subir la imagen: ${error.message}`
              )
            );
            return;
          }

          if (!result) {
            reject(
              new BadRequestException('No se recibió respuesta de Cloudinary')
            );
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      // Convertir buffer a stream
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  async uploadMultipleImages(
    files: any[],
    folder = 'products',
    options?: {
      transformation?: any[];
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
    }
  ): Promise<UploadImageResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const uploadPromises = files.map((file) =>
      this.uploadImage(file, folder, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.cloudinaryConfig) {
      throw new BadRequestException('Cloudinary no está configurado');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`);
    } catch (error: any) {
      this.logger.error(`Error deleting image ${publicId}:`, error);
      throw new BadRequestException(
        `Error al eliminar la imagen: ${error.message}`
      );
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0) {
      return;
    }

    try {
      await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Deleted ${publicIds.length} images`);
    } catch (error: any) {
      this.logger.error('Error deleting multiple images:', error);
      throw new BadRequestException(
        `Error al eliminar las imágenes: ${error.message}`
      );
    }
  }

  /**
   * Genera una URL optimizada para diferentes tamaños
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    if (!this.cloudinaryConfig) {
      return '';
    }

    const transformation: any[] = [];

    if (options.width || options.height) {
      transformation.push({
        width: options.width,
        height: options.height,
        crop: options.crop || 'limit',
      });
    }

    if (options.quality) {
      transformation.push({ quality: options.quality });
    }

    if (options.format) {
      transformation.push({ fetch_format: options.format });
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation,
    });
  }
}
