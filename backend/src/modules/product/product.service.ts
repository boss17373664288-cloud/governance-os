import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResult } from '../../shared/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query: PaginationDto & { search?: string; category?: string }): Promise<PaginatedResult<Product>> {
    const { page = 1, page_size = 20, sort_by = 'created_at', sort_order = 'DESC', search, category } = query;
    const where: any = {};
    if (category) where.product_category = category;

    const [items, total] = await this.productRepo.findAndCount({
      where: search ? [
        { ...where, product_name: Like("%" + search + "%") },
        { ...where, product_code: Like("%" + search + "%") },
      ] : where,
      order: { [sort_by]: sort_order },
      skip: (page - 1) * page_size,
      take: page_size,
    });

    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { product_id: id } });
    if (!product) throw new HttpException({ errorCode: 'PROD_001', message: '產品不存在' }, HttpStatus.NOT_FOUND);
    return product;
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const productCode = dto.product_code || ("PROD-" + Date.now());
    const existing = await this.productRepo.findOne({ where: { product_code: productCode } });
    if (existing) throw new HttpException({ errorCode: 'PROD_002', message: '產品編碼重複' }, HttpStatus.CONFLICT);
    return this.productRepo.save({
      product_id: uuidv4(),
      product_code: productCode,
      product_name: dto.product_name,
      product_short_name: dto.product_short_name || null,
      product_barcode: dto.product_barcode || null,
      product_uid_code: dto.product_uid_code || null,
      product_category: dto.product_category || 'DEVICE',
      product_series: dto.product_series || null,
      product_specification: dto.product_specification || null,
      medical_device_flag: dto.medical_device_flag || false,
      medical_device_class: dto.medical_device_class || null,
      medical_registration_no: dto.medical_registration_no || null,
      expiration_days: dto.expiration_days || null,
      base_price: dto.base_price || 0,
      minimum_price: dto.minimum_price || 0,
      recall_level: dto.recall_level || 'R1',
      brand_series_id: dto.brand_series_id || null,
      tenant_id: '00000000-0000-0000-0000-000000000001',
      created_by: userId,
    } as any);
  }

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.product_name !== undefined) product.product_name = dto.product_name;
    if (dto.product_short_name !== undefined) product.product_short_name = dto.product_short_name;
    if (dto.product_barcode !== undefined) product.product_barcode = dto.product_barcode;
    if (dto.product_uid_code !== undefined) product.product_uid_code = dto.product_uid_code;
    if (dto.product_category !== undefined) product.product_category = dto.product_category;
    if (dto.product_series !== undefined) product.product_series = dto.product_series;
    if (dto.product_specification !== undefined) product.product_specification = dto.product_specification;
    if (dto.medical_device_flag !== undefined) product.medical_device_flag = dto.medical_device_flag;
    if (dto.medical_device_class !== undefined) product.medical_device_class = dto.medical_device_class;
    if (dto.medical_registration_no !== undefined) product.medical_registration_no = dto.medical_registration_no;
    if (dto.expiration_days !== undefined) product.expiration_days = dto.expiration_days;
    if (dto.base_price !== undefined) product.base_price = dto.base_price;
    if (dto.minimum_price !== undefined) product.minimum_price = dto.minimum_price;
    if (dto.recall_level !== undefined) product.recall_level = dto.recall_level;
    if (dto.brand_series_id !== undefined) product.brand_series_id = dto.brand_series_id;
    product.updated_by = userId;
    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepo.softDelete(id);
  }
}