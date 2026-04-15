export type Person = {
  id: number;
  name: string;
  nickname?: string;
  email: string;
  birthdate: string;
  customTemplate?: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageTemplate = {
  id: number;
  body: string;
  templates?: string[];
  updated_at: string;
};

export type SendLog = {
  id: number;
  person_id: number;
  person_name: string | null;
  person_email: string | null;
  sent_local_date: string;
  sent_at: string;
  status: "success" | "failed";
  error: string | null;
};
