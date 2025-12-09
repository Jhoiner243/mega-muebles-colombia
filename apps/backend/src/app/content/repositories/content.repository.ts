import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma';

@Injectable()
export class ContentRepository {
  constructor(private prisma: PrismaService) {}

  // Banners
  async findActiveBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAllBanners() {
    return this.prisma.banner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findBannerById(id: string) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  async createBanner(data: Prisma.BannerCreateInput) {
    return this.prisma.banner.create({ data });
  }

  async updateBanner(id: string, data: Prisma.BannerUpdateInput) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async deleteBanner(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  // Downloads
  async findAllDownloads() {
    return this.prisma.download.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDownloadById(id: string) {
    return this.prisma.download.findUnique({ where: { id } });
  }

  async createDownload(data: Prisma.DownloadCreateInput) {
    return this.prisma.download.create({ data });
  }

  async incrementDownloadCount(id: string) {
    return this.prisma.download.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  }

  async deleteDownload(id: string) {
    return this.prisma.download.delete({ where: { id } });
  }

  // Blog Posts
  async findPublishedPosts(limit?: number) {
    return this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findAllPosts() {
    return this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPostBySlug(slug: string) {
    return this.prisma.blogPost.findUnique({ where: { slug } });
  }

  async findPostById(id: string) {
    return this.prisma.blogPost.findUnique({ where: { id } });
  }

  async createPost(data: Prisma.BlogPostCreateInput) {
    return this.prisma.blogPost.create({ data });
  }

  async updatePost(id: string, data: Prisma.BlogPostUpdateInput) {
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async deletePost(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
