import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(AuthGuard("jwt"))
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get("dashboard")
  getDashboard(@Query("warehouse_id") whId?: string) { return this.service.getDashboard(whId); }

  @Get("batches")
  getBatches(@Query() q: any) { return this.service.getBatches(q); }

  @Get("batches/:id")
  getBatch(@Param("id") id: string) { return this.service.findOneBatch(id); }

  @Post("batches")
  createBatch(@Body() dto: any) { return this.service.createBatch(dto); }

  @Put("batches/:id")
  updateBatch(@Param("id") id: string, @Body() dto: any) { return this.service.updateBatch(id, dto); }

  @Delete("batches/:id")
  removeBatch(@Param("id") id: string) { return this.service.removeBatch(id); }

  @Get("warehouses")
  getWarehouses() { return this.service.getWarehouses(); }

  @Post("warehouses")
  createWarehouse(@Body() dto: any) { return this.service.createWarehouse(dto); }

  @Put("warehouses/:id")
  updateWarehouse(@Param("id") id: string, @Body() dto: any) { return this.service.updateWarehouse(id, dto); }

  @Delete("warehouses/:id")
  removeWarehouse(@Param("id") id: string) { return this.service.removeWarehouse(id); }
}