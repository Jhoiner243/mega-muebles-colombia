import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { Role } from '@prisma/client';
import { ContentService } from './content.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  CreateDownloadDto,
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dtos';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // Banners - Public
  @Get('banners')
  getActiveBanners() {
    return this.contentService.getActiveBanners();
  }

  // Banners - Admin
  @Get('banners/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllBanners() {
    return this.contentService.getAllBanners();
  }

  @Get('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getBannerById(@Param('id') id: string) {
    return this.contentService.getBannerById(id);
  }

  @Post('banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createBanner(@Body() dto: CreateBannerDto) {
    return this.contentService.createBanner(dto);
  }

  @Put('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.contentService.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteBanner(@Param('id') id: string) {
    return this.contentService.deleteBanner(id);
  }

  // Downloads - Public
  @Get('downloads')
  getAllDownloads() {
    return this.contentService.getAllDownloads();
  }

  @Get('downloads/:id')
  getDownloadById(@Param('id') id: string) {
    return this.contentService.getDownloadById(id);
  }

  @Post('downloads/:id/increment')
  incrementDownloadCount(@Param('id') id: string) {
    return this.contentService.incrementDownloadCount(id);
  }

  // Downloads - Admin
  @Post('downloads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createDownload(@Body() dto: CreateDownloadDto) {
    return this.contentService.createDownload(dto);
  }

  @Delete('downloads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteDownload(@Param('id') id: string) {
    return this.contentService.deleteDownload(id);
  }

  // Blog Posts - Public
  @Get('blog')
  getPublishedPosts(@Query('limit') limit?: string) {
    return this.contentService.getPublishedPosts(
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('blog/:slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.contentService.getPostBySlug(slug);
  }

  // Blog Posts - Admin
  @Get('blog/all/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllPosts() {
    return this.contentService.getAllPosts();
  }

  @Get('blog/post/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPostById(@Param('id') id: string) {
    return this.contentService.getPostById(id);
  }

  @Post('blog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createPost(@Body() dto: CreateBlogPostDto) {
    return this.contentService.createPost(dto);
  }

  @Put('blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.contentService.updatePost(id, dto);
  }

  @Delete('blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deletePost(@Param('id') id: string) {
    return this.contentService.deletePost(id);
  }
}

