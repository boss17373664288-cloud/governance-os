import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { PrintTemplate, PaperFormat, PrintJob } from './print.entity';
import { CreateTemplateDto, RenderPdfDto } from './dto/print.dto';

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();
  private browser: any = null;

  constructor(
    @InjectRepository(PrintTemplate) private readonly templateRepo: Repository<PrintTemplate>,
    @InjectRepository(PaperFormat) private readonly paperRepo: Repository<PaperFormat>,
    @InjectRepository(PrintJob) private readonly jobRepo: Repository<PrintJob>,
  ) {}

  async createTemplate(dto: CreateTemplateDto, userId: string): Promise<PrintTemplate> {
    const tpl = this.templateRepo.create({ ...dto, created_by: userId });
    return this.templateRepo.save(tpl);
  }

  async getTemplates(entityType?: string): Promise<PrintTemplate[]> {
    const where: any = { is_active: true };
    if (entityType) where.entity_type = entityType;
    return this.templateRepo.find({ where, order: { entity_type: 'ASC', part_index: 'ASC' } });
  }

  async getVariables(entityType: string): Promise<string[]> {
    const defaults: Record<string, string[]> = {
      SALES_ORDER: ['orderNo','orderDate','customerName','customerAddress','contactPerson','items','totalAmount','paymentTerms'],
      PURCHASE_ORDER: ['poNo','orderDate','supplierName','items','totalAmount'],
      CONSIGNMENT_RELEASE: ['releaseNo','customerName','productName','quantity','releaseDate'],
      RECALL_NOTICE: ['recallNo','recallLevel','productName','batchNo','description'],
      SAMPLE_REQUEST: ['sampleNo','customerName','productName','quantity','purpose'],
    };
    return defaults[entityType] || [];
  }

  async renderPdf(dto: RenderPdfDto, userId: string): Promise<any> {
    const templates = await this.templateRepo.find({
      where: { entity_type: dto.entity_type, is_active: true },
      order: { part_index: 'ASC' },
    });
    if (templates.length === 0) throw new HttpException({ errorCode: 'PRINT_001', message: '模板不存在' }, HttpStatus.NOT_FOUND);

    // Filter by template_code if specified
    const matched = dto.template_code ? templates.filter(t => t.template_code === dto.template_code) : templates.filter(t => t.template_code === templates[0].template_code);
    if (matched.length === 0) throw new HttpException({ errorCode: 'PRINT_001', message: '模板不存在' }, HttpStatus.NOT_FOUND);

    try {
      const htmlParts: string[] = [];
      for (const tpl of matched) {
        const compiled = Handlebars.compile(tpl.html_content);
        const html = compiled(dto.data);
        const paper = tpl.paper_format_id ? await this.paperRepo.findOne({ where: { paper_format_id: tpl.paper_format_id } }) : null;
        htmlParts.push(this.wrapHtml(html, paper));
      }

      const combined = htmlParts.join('<div style="page-break-after:always;"></div>');
      const pdfBuffer = await this.generatePdf(combined);

      const job = this.jobRepo.create({
        template_id: matched[0].template_id, entity_type: dto.entity_type,
        entity_id: dto.entity_id, status: 'SUCCESS', created_by: userId, completed_at: new Date(),
      });
      const saved = await this.jobRepo.save(job);
      return { job_id: saved.job_id, pdf_base64: pdfBuffer.toString('base64') };
    } catch (error) {
      this.logger.error('PDF render failed', error);
      throw new HttpException({ errorCode: 'PRINT_002', message: String(error) }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
  async generatePdfForEntity(entityType: string, entityId: string, userId: string): Promise<any> {
    // Look up entity data and render PDF
    let data: any = {};
    const templates = await this.templateRepo.find({
      where: { entity_type: entityType, is_active: true },
      order: { part_index: 'ASC' },
    });
    if (templates.length === 0) throw new HttpException({ errorCode: 'PRINT_001', message: '模板不存在' }, HttpStatus.NOT_FOUND);

    const tpl = templates[0]; // Use first matching template

    // Fetch entity data based on type
    switch (entityType) {
      case 'sales_order': {
        const rows = await this.templateRepo.manager.query(
          "SELECT so.*, cm.customer_name, cm.customer_code FROM sales_order so LEFT JOIN customer_master cm ON cm.customer_id = so.customer_id WHERE so.order_id = $1", [entityId]
        );
        if (rows.length === 0) throw new HttpException({ errorCode: 'PRINT_003', message: '訂單不存在' }, HttpStatus.NOT_FOUND);
        const order = rows[0];
        const items = await this.templateRepo.manager.query(
          "SELECT soi.*, pm.product_name, pm.product_code FROM sales_order_item soi LEFT JOIN product_master pm ON pm.product_id = soi.product_id WHERE soi.order_id = $1", [entityId]
        );
        data = {
          orderNo: order.order_no, orderDate: order.order_date?.slice(0,10), customerName: order.customer_name,
          customerCode: order.customer_code, totalAmount: Number(order.total_amount||0).toLocaleString(),
          items: items.map((it:any) => ({ productCode: it.product_code, productName: it.product_name, quantity: it.quantity, unitPrice: Number(it.unit_price||0).toLocaleString(), subtotal: Number(it.subtotal||0).toLocaleString() })),
        };
        break;
      }
      case 'purchase_order': {
        const rows = await this.templateRepo.manager.query(
          "SELECT po.*, sm.supplier_name FROM purchase_order po LEFT JOIN supplier_master sm ON sm.supplier_id = po.supplier_id WHERE po.po_id = $1", [entityId]
        );
        if (rows.length === 0) throw new HttpException({ errorCode: 'PRINT_003', message: '採購單不存在' }, HttpStatus.NOT_FOUND);
        const po = rows[0];
        const items = await this.templateRepo.manager.query(
          "SELECT poi.*, pm.product_name, pm.product_code FROM purchase_order_item poi LEFT JOIN product_master pm ON pm.product_id = poi.product_id WHERE poi.po_id = $1", [entityId]
        );
        data = {
          poNo: po.po_no, orderDate: po.order_date?.slice(0,10), supplierName: po.supplier_name,
          totalAmount: Number(po.total_amount||0).toLocaleString(),
          items: items.map((it:any) => ({ productCode: it.product_code, productName: it.product_name, quantity: it.quantity, unitPrice: Number(it.unit_price||0).toLocaleString() })),
        };
        break;
      }
      default: throw new HttpException({ errorCode: 'PRINT_004', message: '不支援的單據類型' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const compiled = Handlebars.compile(tpl.html_content);
      const html = compiled(data);
      const paper = tpl.paper_format_id ? await this.paperRepo.findOne({ where: { paper_format_id: tpl.paper_format_id } }) : null;
      const wrapped = this.wrapHtml(html, paper);
      const pdfBuffer = await this.generatePdf(wrapped);

      const job = this.jobRepo.create({
        template_id: tpl.template_id, entity_type: entityType,
        entity_id: entityId, status: 'SUCCESS', created_by: userId, completed_at: new Date(),
      });
      const saved = await this.jobRepo.save(job);
      return { job_id: saved.job_id, pdf_base64: pdfBuffer.toString('base64') };
    } catch (error) {
      this.logger.error('PDF render failed', error);
      throw new HttpException({ errorCode: 'PRINT_002', message: String(error) }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private wrapHtml(body: string, paper: PaperFormat | null): string {
    const w = (paper && paper.width_mm) || 210;
    const h = (paper && paper.height_mm) || 297;
    const hStyle = h > 5000 ? '' : 'height:' + h + 'mm;';
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '@page{size:' + w + 'mm ' + (h > 5000 ? '99999mm' : h + 'mm') + ';margin:10mm;}'
      + 'body{font-family:"Microsoft JhengHei",SimSun,sans-serif;font-size:12px;' + hStyle + '}'
      + 'table{width:100%;border-collapse:collapse;}'
      + 'th,td{border:1px solid #000;padding:4px 6px;}'
      + 'th{background:#f0f0f0;}'
      + '.text-right{text-align:right;}.text-center{text-align:center;}'
      + '</style></head><body>' + body + '</body></html>';
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
    await page.close();
    return Buffer.from(pdf);
  }

  private async getBrowser(): Promise<any> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });
    }
    return this.browser;
  }
}
