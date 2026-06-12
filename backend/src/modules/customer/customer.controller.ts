import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CustomerService } from "./customer.service";
import { CreateCustomerDto, UpdateCustomerDto } from "./dto/customer.dto";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { RolesGuard } from "../../core/auth/guards/roles.guard";

@Controller("customers")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async findAll(
    @Query() query: PaginationDto & { search?: string; status?: string },
    @CurrentUser() user: any,
  ) {
    const filter: any = { ...query };
    if (user.role_code === "SALES") {
      filter.owning_employee_id = user.employee_id;
    } else if (user.role_code === "REGION_MANAGER") {
      filter.region_code = user.region_code;
    }
    return this.customerService.findAll(filter);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.customerService.findOne(id);
  }

  @Get(":id/contacts")
  async getContacts(@Param("id") id: string) {
    return this.customerService.getContacts(id);
  }

  @Get(":id/timeline")
  async getTimeline(@Param("id") id: string) {
    return this.customerService.getTimeline(id);
  }

  @Get(":id/consignment")
  async getConsignment(@Param("id") id: string) {
    return this.customerService.getConsignment(id);
  }

  @Post()
  @Roles("SALES", "REGION_MANAGER", "SALES_DIRECTOR", "ADMIN")
  async create(@Body() dto: CreateCustomerDto, @CurrentUser("employee_id") userId: string) {
    return this.customerService.create(dto, userId);
  }

  @Put(":id")
  @Roles("SALES", "REGION_MANAGER", "SALES_DIRECTOR", "ADMIN")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser("employee_id") userId: string,
  ) {
    return this.customerService.update(id, dto, userId);
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(@Param("id") id: string) {
    return this.customerService.remove(id);
  }
  @Post(":id/contacts")
  createContact(@Param("id") id: string, @Body() dto: any) {
    return this.customerService.createContact(id, dto);
  }

  @Put(":id/contacts/:contactId")
  updateContact(@Param("id") id: string, @Param("contactId") contactId: string, @Body() dto: any) {
    return this.customerService.updateContact(id, contactId, dto);
  }

  @Delete(":id/contacts/:contactId")
  deleteContact(@Param("id") id: string, @Param("contactId") contactId: string) {
    return this.customerService.deleteContact(id, contactId);
  }
}