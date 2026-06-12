import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductService } from "./product.service";
import { ProductBrandSeries } from "../../entities/brand-series.entity";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";

@Controller("products")
@UseGuards(AuthGuard("jwt"))
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @InjectRepository(ProductBrandSeries) private readonly brandRepo: Repository<ProductBrandSeries>,
  ) {}

  @Get("brand-series")
  getBrandSeries() {
    return this.brandRepo.find({ order: { brand_name: "ASC" } });
  }

  @Get()
  findAll(@Query() query: PaginationDto & { search?: string; category?: string }) {
    return this.productService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser("employee_id") userId: string) {
    return this.productService.create(dto, userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @CurrentUser("employee_id") userId: string) {
    return this.productService.update(id, dto, userId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productService.remove(id);
  }
}