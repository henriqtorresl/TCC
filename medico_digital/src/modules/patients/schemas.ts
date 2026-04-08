import { UpdatePatientInput } from "@/modules/patients/types";

type ValidationError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

const updatableFields = ["fullName", "birthDate", "cpf", "phone", "gender"] as const;
const allowedGenders = ["male", "female", "other", "unknown"] as const;

export function validateUpdatePatientBody(
  body: unknown,
): ValidationResult<UpdatePatientInput> {
  if (!body || typeof body !== "object") {
    return {
      success: false,
      error: {
        code: "invalid_request_body",
        message:
          "Corpo da requisicao invalido. Envie um objeto JSON com campos de paciente.",
        details: { updatableFields },
      },
    };
  }

  const candidate = body as Record<string, unknown>;
  const hasAnyField = updatableFields.some((field) =>
    Object.prototype.hasOwnProperty.call(candidate, field),
  );

  if (!hasAnyField) {
    return {
      success: false,
      error: {
        code: "required_fields_missing",
        message:
          "Informe ao menos um campo para atualizacao: fullName, birthDate, cpf, phone ou gender.",
        details: { updatableFields },
      },
    };
  }

  const output: UpdatePatientInput = {};

  if (Object.prototype.hasOwnProperty.call(candidate, "fullName")) {
    if (typeof candidate.fullName !== "string" || candidate.fullName.trim() === "") {
      return {
        success: false,
        error: {
          code: "invalid_full_name",
          message: "fullName deve ser uma string nao vazia.",
        },
      };
    }
    output.fullName = candidate.fullName.trim();
  }

  if (Object.prototype.hasOwnProperty.call(candidate, "cpf")) {
    if (candidate.cpf !== null && typeof candidate.cpf !== "string") {
      return {
        success: false,
        error: {
          code: "invalid_cpf",
          message: "cpf deve ser string ou null.",
        },
      };
    }
    output.cpf =
      typeof candidate.cpf === "string" ? candidate.cpf.trim() || null : null;
  }

  if (Object.prototype.hasOwnProperty.call(candidate, "phone")) {
    if (candidate.phone !== null && typeof candidate.phone !== "string") {
      return {
        success: false,
        error: {
          code: "invalid_phone",
          message: "phone deve ser string ou null.",
        },
      };
    }
    output.phone =
      typeof candidate.phone === "string" ? candidate.phone.trim() || null : null;
  }

  if (Object.prototype.hasOwnProperty.call(candidate, "birthDate")) {
    if (candidate.birthDate !== null && typeof candidate.birthDate !== "string") {
      return {
        success: false,
        error: {
          code: "invalid_birth_date",
          message: "birthDate deve ser string no formato YYYY-MM-DD ou null.",
        },
      };
    }

    const normalizedBirthDate =
      typeof candidate.birthDate === "string" ? candidate.birthDate.trim() : "";

    if (normalizedBirthDate === "") {
      output.birthDate = null;
    } else {
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(normalizedBirthDate);
      if (!isValidDate) {
        return {
          success: false,
          error: {
            code: "invalid_birth_date",
            message: "birthDate deve seguir o formato YYYY-MM-DD.",
          },
        };
      }
      output.birthDate = normalizedBirthDate;
    }
  }

  if (Object.prototype.hasOwnProperty.call(candidate, "gender")) {
    if (candidate.gender !== null && typeof candidate.gender !== "string") {
      return {
        success: false,
        error: {
          code: "invalid_gender",
          message:
            "gender deve ser string (male, female, other, unknown) ou null.",
        },
      };
    }

    const normalizedGender =
      typeof candidate.gender === "string" ? candidate.gender.trim().toLowerCase() : "";

    if (normalizedGender === "") {
      output.gender = null;
    } else if (
      (allowedGenders as readonly string[]).includes(normalizedGender)
    ) {
      output.gender = normalizedGender as UpdatePatientInput["gender"];
    } else {
      return {
        success: false,
        error: {
          code: "invalid_gender",
          message: "gender invalido. Valores aceitos: male, female, other, unknown.",
          details: { allowedGenders },
        },
      };
    }
  }

  return { success: true, data: output };
}
