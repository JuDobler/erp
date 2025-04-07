import { pgTable, text, serial, integer, timestamp, numeric, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'advogado', 'financeiro', 'secretaria', 'estagiario']);
export const leadStatusEnum = pgEnum('lead_status', ['novo', 'em_contato', 'proposta_enviada', 'negociacao', 'convertido', 'perdido']);
export const legalAreaEnum = pgEnum('legal_area', ['direito_bancario', 'direito_empresarial', 'direito_civil', 'direito_criminal', 'direito_administrativo', 'direito_consumidor', 'outros']);
export const leadOriginEnum = pgEnum('lead_origin', ['site', 'indicacao', 'instagram', 'tiktok', 'facebook', 'google', 'outros']);
export const taskPriorityEnum = pgEnum('task_priority', ['baixa', 'media', 'alta', 'urgente']);
export const transactionTypeEnum = pgEnum('transaction_type', ['receita', 'despesa']);
export const documentTypeEnum = pgEnum('document_type', ['contrato', 'procuracao', 'parecer', 'peticao', 'recurso', 'oficio', 'outros']);
export const caseStatusEnum = pgEnum('case_status', ['ativo', 'aguardando_documentos', 'aguardando_decisao', 'em_recurso', 'arquivado', 'ganho', 'perdido']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Leads Table
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  status: leadStatusEnum('status').notNull().default('novo'),
  legalArea: legalAreaEnum('legal_area').notNull(),
  origin: leadOriginEnum('origin').notNull(),
  notes: text('notes'),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  followUpDate: timestamp('follow_up_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clients Table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  document: text('document'),
  convertedFromLeadId: integer('converted_from_lead_id').references(() => leads.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contact History Table
export const contactHistory = pgTable('contact_history', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  clientId: integer('client_id').references(() => clients.id),
  date: timestamp('date').defaultNow().notNull(),
  notes: text('notes').notNull(),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cases Table
export const cases = pgTable('cases', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  legalArea: legalAreaEnum('legal_area').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 10, scale: 2 }),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  status: caseStatusEnum('status').notNull().default('ativo'),
  nextHearing: timestamp('next_hearing'),
  caseNumber: text('case_number'),
  court: text('court'),
  judge: text('judge'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks Table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  deadline: timestamp('deadline'),
  priority: taskPriorityEnum('priority').notNull().default('media'),
  completed: boolean('completed').notNull().default(false),
  clientId: integer('client_id').references(() => clients.id),
  caseId: integer('case_id').references(() => cases.id),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  dueDate: timestamp('due_date'),
  paid: boolean('paid').notNull().default(false),
  caseId: integer('case_id').references(() => cases.id),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Documents Table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  filename: text('filename').notNull(),
  type: documentTypeEnum('type').notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  caseId: integer('case_id').references(() => cases.id),
  clientId: integer('client_id').references(() => clients.id),
  uploadedById: integer('uploaded_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quick Actions Table
export const quickActions = pgTable('quick_actions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  actionType: text('action_type').notNull(),
  templateContent: text('template_content'),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Backups Table
export const backups = pgTable('backups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  filename: text('filename').notNull(),
  fileSize: integer('file_size'),
  createdById: integer('created_by_id').references(() => users.id),
  automatic: boolean('automatic').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactHistorySchema = createInsertSchema(contactHistory).omit({ id: true, createdAt: true });
export const insertCaseSchema = createInsertSchema(cases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuickActionSchema = createInsertSchema(quickActions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });

// Types for inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertContactHistory = z.infer<typeof insertContactHistorySchema>;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertQuickAction = z.infer<typeof insertQuickActionSchema>;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

// Types for selects
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ContactHistory = typeof contactHistory.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type QuickAction = typeof quickActions.$inferSelect;
export type Backup = typeof backups.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: "O nome de usuário é obrigatório" }),
  password: z.string().min(1, { message: "A senha é obrigatória" }),
});

export type LoginData = z.infer<typeof loginSchema>;

// Helper Constant Mappings
export const legalAreaLabels = {
  direito_bancario: "Direito Bancário",
  direito_empresarial: "Direito Empresarial",
  direito_civil: "Direito Civil",
  direito_criminal: "Direito Criminal",
  direito_administrativo: "Direito Administrativo",
  direito_consumidor: "Direito do Consumidor",
  outros: "Outros"
};

export const leadOriginLabels = {
  site: "Site",
  indicacao: "Indicação",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  google: "Google",
  outros: "Outros"
};

export const leadStatusLabels = {
  novo: "Novo Lead",
  em_contato: "Em Contato",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  convertido: "Convertido",
  perdido: "Perdido"
};

export const userRoleLabels = {
  admin: "Administrador",
  advogado: "Advogado(a)",
  financeiro: "Financeiro",
  secretaria: "Secretária",
  estagiario: "Estagiário(a)"
};

export const taskPriorityLabels = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente"
};

export const documentTypeLabels = {
  contrato: "Contrato",
  procuracao: "Procuração",
  parecer: "Parecer Jurídico",
  peticao: "Petição",
  recurso: "Recurso",
  oficio: "Ofício",
  outros: "Outros"
};

export const caseStatusLabels = {
  ativo: "Ativo",
  aguardando_documentos: "Aguardando Documentos",
  aguardando_decisao: "Aguardando Decisão",
  em_recurso: "Em Recurso",
  arquivado: "Arquivado",
  ganho: "Ganho",
  perdido: "Perdido"
};
