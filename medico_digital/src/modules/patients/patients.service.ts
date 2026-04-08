import { PatientsRepository } from "@/modules/patients/patients.repository";
import { UpdatePatientInput } from "@/modules/patients/types";

export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository | null = null) {}

  async getMe(userId: number) {
    if (!this.patientsRepository) {
      throw new Error("database_not_configured");
    }

    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error("invalid_user_id");
    }

    const existing = await this.patientsRepository.findByUserId(numericUserId);
    if (existing) {
      return existing;
    }

    const created = await this.patientsRepository.createForUser(numericUserId);
    if (!created) {
      throw new Error("user_not_found");
    }

    return created;
  }

  async updateMe(userId: number, payload: UpdatePatientInput) {
    if (!this.patientsRepository) {
      throw new Error("database_not_configured");
    }

    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      throw new Error("invalid_user_id");
    }

    const createdOrExisting = await this.patientsRepository.createForUser(
      numericUserId,
    );
    if (!createdOrExisting) {
      throw new Error("user_not_found");
    }

    const updated = await this.patientsRepository.updateByUserId(
      numericUserId,
      payload,
    );
    if (!updated) {
      throw new Error("patient_not_found");
    }

    return updated;
  }
}
