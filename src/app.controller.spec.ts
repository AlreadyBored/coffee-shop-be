import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API information', () => {
      const result = appController.getHello();

      expect(result).toHaveProperty('message', 'Coffee House API is running!');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('version', '1.0.0');
      expect(result.data).toHaveProperty('endpoints');
      expect(result.data.endpoints).toHaveProperty('products');
      expect(result.data.endpoints).toHaveProperty('auth');
      expect(result.data.endpoints).toHaveProperty('orders');
    });
  });
});
