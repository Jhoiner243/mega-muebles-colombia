import { IsArray, IsString } from 'class-validator';

export class DeleteImageDto {
  @IsArray()
  @IsString({ each: true })
  publicIds: string[];
}

