import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CompanyService } from "./company.service";

@Controller("companies")
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(AuthGuard("jwt"))
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(AuthGuard("jwt"))
  @Delete(":id")
  remove(@Param("id") id: string) { return this.service.remove(id); }
}