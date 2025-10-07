import { Module, forwardRef } from '@nestjs/common';
import { ProductsModule } from '../modules/products/products.module';
import { SeedService } from './services/seed.service';
import { ErrorSimulationService } from './services/error-simulation.service';

@Module({
  imports: [forwardRef(() => ProductsModule)],
  providers: [SeedService, ErrorSimulationService],
  exports: [SeedService, ErrorSimulationService],
})
export class CommonModule {}
