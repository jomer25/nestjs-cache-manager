import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    const helloWorld = this.appService.getHello();
    await this.cacheManager.set('cache_item', helloWorld);
    const cacheItem = this.cacheManager.get('cache_item');
    console.log(cacheItem);
    return helloWorld;
  }
}
