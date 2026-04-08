export type UpdatePatientInput = {
  fullName?: string;
  birthDate?: string | null;
  cpf?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | "unknown" | null;
};

export type PatientProfile = {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  birth_date: string | null;
  cpf: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | "unknown" | null;
  created_at: string;
  updated_at: string;
};
