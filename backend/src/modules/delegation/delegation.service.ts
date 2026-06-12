import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Delegation } from "../../entities/delegation.entity";

@Injectable()
export class DelegationService {
  constructor(@InjectRepository(Delegation) private readonly repo: Repository<Delegation>) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.delegator_id) where.delegator_id = query.delegator_id;
    if (query.delegate_id) where.delegate_id = query.delegate_id;
    if (query.status) where.status = query.status;
    return this.repo.find({ where, order: { created_at: "DESC" } });
  }

  async findActive(userId: string) {
    const now = new Date();
    return this.repo.find({
      where: [
        { delegator_id: userId, status: "ACTIVE", start_date: LessThanOrEqual(now), end_date: MoreThanOrEqual(now) },
        { delegate_id: userId, status: "ACTIVE", start_date: LessThanOrEqual(now), end_date: MoreThanOrEqual(now) },
      ],
    });
  }

  async findOne(id: string) {
    const d = await this.repo.findOne({ where: { delegation_id: id } });
    if (!d) throw new HttpException({ errorCode: "DELEG_001", message: "授权记录不存在" }, HttpStatus.NOT_FOUND);
    return d;
  }

  async create(dto: any) {
    return this.repo.save(this.repo.create({ ...dto, delegation_id: undefined, status: "ACTIVE" }));
  }

  async revoke(id: string) {
    const d = await this.findOne(id);
    d.status = "REVOKED";
    return this.repo.save(d);
  }

  async autoExpire() {
    const now = new Date();
    return this.repo.update(
      { status: "ACTIVE", end_date: LessThanOrEqual(now) },
      { status: "EXPIRED" },
    );
  }
}
