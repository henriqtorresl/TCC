import { LoginInput, RegisterInput } from "@/modules/auth/types";

type ValidationError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

export function validateRegisterBody(body: unknown): ValidationResult<RegisterInput> {
  const requiredFields: Array<keyof RegisterInput> = ["fullName", "email", "password"];

  if (!body || typeof body !== "object") {
    return {
      success: false,
      error: {
        code: "invalid_request_body",
        message:
          "Corpo da requisicao invalido. Envie um objeto JSON com os campos obrigatorios.",
        details: { requiredFields },
      },
    };
  }

  const candidate = body as Partial<Record<keyof RegisterInput, unknown>>;
  const missingFields = requiredFields.filter((field) => {
    const value = candidate[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return {
      success: false,
      error: {
        code: "required_fields_missing",
        message:
          "Campos obrigatorios ausentes ou vazios: fullName, email e password.",
        details: { requiredFields, missingFields },
      },
    };
  }

  return {
    success: true,
    data: {
      fullName: (candidate.fullName as string).trim(),
      email: (candidate.email as string).trim(),
      password: candidate.password as string,
    },
  };
}

export function validateLoginBody(body: unknown): ValidationResult<LoginInput> {
  const requiredFields: Array<keyof LoginInput> = ["email", "password"];

  if (!body || typeof body !== "object") {
    return {
      success: false,
      error: {
        code: "invalid_request_body",
        message:
          "Corpo da requisicao invalido. Envie um objeto JSON com os campos obrigatorios.",
        details: { requiredFields },
      },
    };
  }

  const candidate = body as Partial<Record<keyof LoginInput, unknown>>;
  const missingFields = requiredFields.filter((field) => {
    const value = candidate[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return {
      success: false,
      error: {
        code: "required_fields_missing",
        message: "Campos obrigatorios ausentes ou vazios: email e password.",
        details: { requiredFields, missingFields },
      },
    };
  }

  return {
    success: true,
    data: {
      email: (candidate.email as string).trim(),
      password: candidate.password as string,
    },
  };
}
