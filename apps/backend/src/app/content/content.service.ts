import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from './repositories/content.repository';
import { CreateBannerDto, UpdateBannerDto, CreateDownloadDto, CreateBlogPostDto, UpdateBlogPostDto } from './dtos';

@Injectable()
export class ContentService {
  constructor(private contentRepository: ContentRepository) {}

  // Banners
  async getActiveBanners() {
    return this.contentRepository.findActiveBanners();
  }

  async getAllBanners() {
    return this.contentRepository.findAllBanners();
  }

  async getBannerById(id: string) {
    const banner = await this.contentRepository.findBannerById(id);
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }
    return banner;
  }

  async createBanner(dto: CreateBannerDto) {
    return this.contentRepository.createBanner(dto);
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    const banner = await this.contentRepository.findBannerById(id);
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }
    return this.contentRepository.updateBanner(id, dto);
  }

  async deleteBanner(id: string) {
    const banner = await this.contentRepository.findBannerById(id);
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }
    return this.contentRepository.deleteBanner(id);
  }

  // Downloads
  async getAllDownloads() {
    return this.contentRepository.findAllDownloads();
  }

  async getDownloadById(id: string) {
    const download = await this.contentRepository.findDownloadById(id);
    if (!download) {
      throw new NotFoundException('Descarga no encontrada');
    }
    return download;
  }

  async createDownload(dto: CreateDownloadDto) {
    return this.contentRepository.createDownload(dto);
  }

  async incrementDownloadCount(id: string) {
    return this.contentRepository.incrementDownloadCount(id);
  }

  async deleteDownload(id: string) {
    const download = await this.contentRepository.findDownloadById(id);
    if (!download) {
      throw new NotFoundException('Descarga no encontrada');
    }
    return this.contentRepository.deleteDownload(id);
  }

  // Blog Posts
  async getPublishedPosts(limit?: number) {
    return this.contentRepository.findPublishedPosts(limit);
  }

  async getAllPosts() {
    return this.contentRepository.findAllPosts();
  }

  async getPostBySlug(slug: string) {
    const post = await this.contentRepository.findPostBySlug(slug);
    if (!post) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return post;
  }

  async getPostById(id: string) {
    const post = await this.contentRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return post;
  }

  async createPost(dto: CreateBlogPostDto) {
    return this.contentRepository.createPost(dto);
  }

  async updatePost(id: string, dto: UpdateBlogPostDto) {
    const post = await this.contentRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return this.contentRepository.updatePost(id, dto);
  }

  async deletePost(id: string) {
    const post = await this.contentRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return this.contentRepository.deletePost(id);
  }
}

