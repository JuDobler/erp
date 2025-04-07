import { eq, sql, and, desc, asc, isNull, ne, or } from "drizzle-orm";
import { 
  users, leads, clients, contactHistory, cases, tasks, transactions, backups,
  documents, quickActions,
  type User, type InsertUser, type Lead, type InsertLead, type Client, 
  type InsertClient, type ContactHistory, type InsertContactHistory, 
  type Case, type InsertCase, type Task, type InsertTask, 
  type Transaction, type InsertTransaction, type Backup, type InsertBackup,
  type Document, type InsertDocument, type QuickAction, type InsertQuickAction
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Leads
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Clients
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  listClients(): Promise<Client[]>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Contact History
  getContactHistory(id: number): Promise<ContactHistory | undefined>;
  createContactHistory(history: InsertContactHistory): Promise<ContactHistory>;
  listContactHistoryByLead(leadId: number): Promise<ContactHistory[]>;
  listContactHistoryByClient(clientId: number): Promise<ContactHistory[]>;
  
  // Cases
  getCase(id: number): Promise<Case | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  listCases(): Promise<Case[]>;
  listCasesByClient(clientId: number): Promise<Case[]>;
  updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: number): Promise<boolean>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  listTasks(): Promise<Task[]>;
  listTasksByAssignee(userId: number): Promise<Task[]>;
  listTasksByClient(clientId: number): Promise<Task[]>;
  listTasksByCase(caseId: number): Promise<Task[]>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(): Promise<Transaction[]>;
  listTransactionsByCase(caseId: number): Promise<Transaction[]>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  listDocuments(): Promise<Document[]>;
  listDocumentsByCase(caseId: number): Promise<Document[]>;
  listDocumentsByClient(clientId: number): Promise<Document[]>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Quick Actions
  getQuickAction(id: number): Promise<QuickAction | undefined>;
  createQuickAction(quickAction: InsertQuickAction): Promise<QuickAction>;
  listQuickActions(): Promise<QuickAction[]>;
  updateQuickAction(id: number, quickAction: Partial<InsertQuickAction>): Promise<QuickAction | undefined>;
  deleteQuickAction(id: number): Promise<boolean>;
  
  // Backups
  createBackup(backup: InsertBackup): Promise<Backup>;
  listBackups(): Promise<Backup[]>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private leadsMap: Map<number, Lead>;
  private clientsMap: Map<number, Client>;
  private contactHistoryMap: Map<number, ContactHistory>;
  private casesMap: Map<number, Case>;
  private tasksMap: Map<number, Task>;
  private transactionsMap: Map<number, Transaction>;
  private documentsMap: Map<number, Document>;
  private quickActionsMap: Map<number, QuickAction>;
  private backupsMap: Map<number, Backup>;
  
  private userId: number = 1;
  private leadId: number = 1;
  private clientId: number = 1;
  private contactHistoryId: number = 1;
  private caseId: number = 1;
  private taskId: number = 1;
  private transactionId: number = 1;
  private documentId: number = 1;
  private quickActionId: number = 1;
  private backupId: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.leadsMap = new Map();
    this.clientsMap = new Map();
    this.contactHistoryMap = new Map();
    this.casesMap = new Map();
    this.tasksMap = new Map();
    this.transactionsMap = new Map();
    this.documentsMap = new Map();
    this.quickActionsMap = new Map();
    this.backupsMap = new Map();
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin1983",
      name: "Administrador",
      role: "admin",
      email: "admin@dobleradvogados.com",
      phone: ""
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.usersMap.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // Leads
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const lead: Lead = { ...insertLead, id, createdAt, updatedAt };
    this.leadsMap.set(id, lead);
    return lead;
  }

  async listLeads(): Promise<Lead[]> {
    return Array.from(this.leadsMap.values());
  }

  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leadsMap.get(id);
    if (!lead) return undefined;
    
    const updatedAt = new Date();
    const updatedLead: Lead = { ...lead, ...leadData, updatedAt };
    this.leadsMap.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leadsMap.delete(id);
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clientsMap.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const client: Client = { ...insertClient, id, createdAt, updatedAt };
    this.clientsMap.set(id, client);
    return client;
  }

  async listClients(): Promise<Client[]> {
    return Array.from(this.clientsMap.values());
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clientsMap.get(id);
    if (!client) return undefined;
    
    const updatedAt = new Date();
    const updatedClient: Client = { ...client, ...clientData, updatedAt };
    this.clientsMap.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clientsMap.delete(id);
  }

  // Contact History
  async getContactHistory(id: number): Promise<ContactHistory | undefined> {
    return this.contactHistoryMap.get(id);
  }

  async createContactHistory(insertHistory: InsertContactHistory): Promise<ContactHistory> {
    const id = this.contactHistoryId++;
    const createdAt = new Date();
    const history: ContactHistory = { ...insertHistory, id, createdAt };
    this.contactHistoryMap.set(id, history);
    return history;
  }

  async listContactHistoryByLead(leadId: number): Promise<ContactHistory[]> {
    return Array.from(this.contactHistoryMap.values())
      .filter(history => history.leadId === leadId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async listContactHistoryByClient(clientId: number): Promise<ContactHistory[]> {
    return Array.from(this.contactHistoryMap.values())
      .filter(history => history.clientId === clientId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Cases
  async getCase(id: number): Promise<Case | undefined> {
    return this.casesMap.get(id);
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = this.caseId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const caseData: Case = { ...insertCase, id, createdAt, updatedAt };
    this.casesMap.set(id, caseData);
    return caseData;
  }

  async listCases(): Promise<Case[]> {
    return Array.from(this.casesMap.values());
  }

  async listCasesByClient(clientId: number): Promise<Case[]> {
    return Array.from(this.casesMap.values())
      .filter(caseItem => caseItem.clientId === clientId);
  }

  async updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = this.casesMap.get(id);
    if (!existingCase) return undefined;
    
    const updatedAt = new Date();
    const updatedCase: Case = { ...existingCase, ...caseData, updatedAt };
    this.casesMap.set(id, updatedCase);
    return updatedCase;
  }

  async deleteCase(id: number): Promise<boolean> {
    return this.casesMap.delete(id);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksMap.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const task: Task = { ...insertTask, id, createdAt, updatedAt };
    this.tasksMap.set(id, task);
    return task;
  }

  async listTasks(): Promise<Task[]> {
    return Array.from(this.tasksMap.values());
  }

  async listTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values())
      .filter(task => task.assignedToId === userId);
  }

  async listTasksByClient(clientId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values())
      .filter(task => task.clientId === clientId);
  }

  async listTasksByCase(caseId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values())
      .filter(task => task.caseId === caseId);
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasksMap.get(id);
    if (!task) return undefined;
    
    const updatedAt = new Date();
    const updatedTask: Task = { ...task, ...taskData, updatedAt };
    this.tasksMap.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasksMap.delete(id);
  }

  // Transactions
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsMap.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const createdAt = new Date();
    const transaction: Transaction = { ...insertTransaction, id, createdAt };
    this.transactionsMap.set(id, transaction);
    return transaction;
  }

  async listTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values());
  }

  async listTransactionsByCase(caseId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsMap.values())
      .filter(transaction => transaction.caseId === caseId);
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactionsMap.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { ...transaction, ...transactionData };
    this.transactionsMap.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactionsMap.delete(id);
  }

  // Backups
  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const id = this.backupId++;
    const createdAt = new Date();
    
    // Simula o tamanho do arquivo (entre 1MB e 5MB)
    const fileSize = Math.floor(Math.random() * 4 * 1024 * 1024) + 1024 * 1024;
    
    // Garante que o backup tenha nome e descrição conforme o schema atualizado
    const backup: Backup = { 
      ...insertBackup, 
      id, 
      createdAt,
      name: insertBackup.name || `Backup ${createdAt.toLocaleDateString()}`,
      fileSize,
      description: insertBackup.description || ""
    };
    
    this.backupsMap.set(id, backup);
    return backup;
  }

  async listBackups(): Promise<Backup[]> {
    return Array.from(this.backupsMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsMap.get(id);
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const document: Document = { ...insertDocument, id, createdAt, updatedAt };
    this.documentsMap.set(id, document);
    return document;
  }
  
  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documentsMap.values());
  }
  
  async listDocumentsByCase(caseId: number): Promise<Document[]> {
    return Array.from(this.documentsMap.values())
      .filter(document => document.caseId === caseId);
  }
  
  async listDocumentsByClient(clientId: number): Promise<Document[]> {
    return Array.from(this.documentsMap.values())
      .filter(document => document.clientId === clientId);
  }
  
  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documentsMap.get(id);
    if (!document) return undefined;
    
    const updatedAt = new Date();
    const updatedDocument: Document = { ...document, ...documentData, updatedAt };
    this.documentsMap.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documentsMap.delete(id);
  }
  
  // Quick Actions
  async getQuickAction(id: number): Promise<QuickAction | undefined> {
    return this.quickActionsMap.get(id);
  }
  
  async createQuickAction(insertQuickAction: InsertQuickAction): Promise<QuickAction> {
    const id = this.quickActionId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const quickAction: QuickAction = { ...insertQuickAction, id, createdAt, updatedAt };
    this.quickActionsMap.set(id, quickAction);
    return quickAction;
  }
  
  async listQuickActions(): Promise<QuickAction[]> {
    return Array.from(this.quickActionsMap.values());
  }
  
  async updateQuickAction(id: number, quickActionData: Partial<InsertQuickAction>): Promise<QuickAction | undefined> {
    const quickAction = this.quickActionsMap.get(id);
    if (!quickAction) return undefined;
    
    const updatedAt = new Date();
    const updatedQuickAction: QuickAction = { ...quickAction, ...quickActionData, updatedAt };
    this.quickActionsMap.set(id, updatedQuickAction);
    return updatedQuickAction;
  }
  
  async deleteQuickAction(id: number): Promise<boolean> {
    return this.quickActionsMap.delete(id);
  }
}

export const storage = new MemStorage();
