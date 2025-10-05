import { Module } from '@nestjs/common';
import { ProductsModule } from '../modules/products/products.module';
import { SeedService } from './services/seed.service';

@Module({
  imports: [ProductsModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class CommonModule {}
