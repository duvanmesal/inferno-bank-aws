export class CatalogGetService {
  constructor(redisRepo) {
    this.redisRepo = redisRepo;
  }

  async process() {
    const catalog = await this.redisRepo.getCatalog();
    return catalog;
  }
}
