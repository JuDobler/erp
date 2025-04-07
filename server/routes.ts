import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { z } from "zod";
import { ZodError } from "zod";
import {
  insertUserSchema,
  insertLeadSchema,
  insertClientSchema,
  insertContactHistorySchema,
  insertCaseSchema,
  insertTaskSchema,
  insertTransactionSchema,
  insertBackupSchema,
  insertDocumentSchema,
  insertQuickActionSchema,
  leadStatusEnum,
  legalAreaEnum,
  leadOriginEnum,
  taskPriorityEnum,
  transactionTypeEnum,
  userRoleEnum,
  documentTypeEnum,
  caseStatusEnum,
} from "@shared/schema";

// Setup session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dobler-advogados-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
    })
  );

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Usuário não encontrado" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Senha incorreta" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autorizado" });
  };

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Acesso negado" });
  };

  // Middleware to handle validation errors
  const validateBody = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Erro de validação",
            errors: error.errors,
          });
        }
        next(error);
      }
    };
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  });

  // Users Routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  app.post("/api/users", isAdmin, validateBody(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      if (req.body.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Nome de usuário já existe" });
        }
      }

      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Don't allow deleting the current user
      if (id === (req.user as any).id) {
        return res.status(400).json({ message: "Não é possível excluir o usuário atual" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Leads Routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.listLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, validateBody(insertLeadSchema), async (req, res) => {
    try {
      const lead = await storage.createLead(req.body);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar lead" });
    }
  });

  app.put("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const lead = await storage.updateLead(id, req.body);
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await storage.deleteLead(id);
      if (!success) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      res.json({ message: "Lead excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir lead" });
    }
  });

  // Lead to Client Conversion
  app.post("/api/leads/:id/convert", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      if (lead.status === "convertido") {
        return res.status(400).json({ message: "Lead já foi convertido" });
      }

      // Create client from lead
      const client = await storage.createClient({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        convertedFromLeadId: lead.id,
        address: "",
        document: ""
      });

      // Update lead status
      await storage.updateLead(id, { status: "convertido" });

      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao converter lead" });
    }
  });

  // Contact History Routes
  app.get("/api/leads/:id/contacts", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const contacts = await storage.listContactHistoryByLead(id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar histórico de contatos" });
    }
  });

  app.post("/api/leads/:id/contacts", isAuthenticated, validateBody(insertContactHistorySchema), async (req, res) => {
    try {
      const leadId = parseInt(req.params.id, 10);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      const contact = await storage.createContactHistory({
        ...req.body,
        leadId,
        createdById: (req.user as any).id
      });

      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar histórico de contato" });
    }
  });

  // Clients Routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.listClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar clientes" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clients", isAuthenticated, validateBody(insertClientSchema), async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const client = await storage.updateClient(id, req.body);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json({ message: "Cliente excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir cliente" });
    }
  });

  // Client Contact History
  app.get("/api/clients/:id/contacts", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const contacts = await storage.listContactHistoryByClient(id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar histórico de contatos" });
    }
  });

  app.post("/api/clients/:id/contacts", isAuthenticated, validateBody(insertContactHistorySchema), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id, 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const contact = await storage.createContactHistory({
        ...req.body,
        clientId,
        createdById: (req.user as any).id
      });

      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar histórico de contato" });
    }
  });

  // Cases Routes
  app.get("/api/cases", isAuthenticated, async (req, res) => {
    try {
      const cases = await storage.listCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar casos" });
    }
  });

  app.get("/api/clients/:id/cases", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const cases = await storage.listCasesByClient(id);
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar casos do cliente" });
    }
  });

  app.post("/api/cases", isAuthenticated, validateBody(insertCaseSchema), async (req, res) => {
    try {
      const caseData = await storage.createCase(req.body);
      
      // Create automatic revenue transaction
      if (caseData.value) {
        await storage.createTransaction({
          type: "receita",
          description: `Honorários - ${caseData.title}`,
          amount: caseData.value,
          date: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Due in 30 days
          paid: false,
          caseId: caseData.id,
          createdById: (req.user as any).id
        });
      }
      
      res.status(201).json(caseData);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar caso" });
    }
  });

  app.put("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const caseData = await storage.updateCase(id, req.body);
      if (!caseData) {
        return res.status(404).json({ message: "Caso não encontrado" });
      }
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar caso" });
    }
  });

  app.delete("/api/cases/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await storage.deleteCase(id);
      if (!success) {
        return res.status(404).json({ message: "Caso não encontrado" });
      }
      res.json({ message: "Caso excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir caso" });
    }
  });

  // Tasks Routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.listTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar tarefas" });
    }
  });

  app.get("/api/tasks/my", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.listTasksByAssignee((req.user as any).id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar tarefas" });
    }
  });

  app.get("/api/clients/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const tasks = await storage.listTasksByClient(id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar tarefas do cliente" });
    }
  });

  app.get("/api/cases/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const tasks = await storage.listTasksByCase(id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar tarefas do caso" });
    }
  });

  app.post("/api/tasks", isAuthenticated, validateBody(insertTaskSchema), async (req, res) => {
    try {
      const task = await storage.createTask({
        ...req.body,
        createdById: (req.user as any).id
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const task = await storage.updateTask(id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar tarefa" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      res.json({ message: "Tarefa excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir tarefa" });
    }
  });

  // Transactions Routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.listTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar transações" });
    }
  });

  app.get("/api/cases/:id/transactions", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const transactions = await storage.listTransactionsByCase(id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar transações do caso" });
    }
  });

  app.post("/api/transactions", isAuthenticated, validateBody(insertTransactionSchema), async (req, res) => {
    try {
      const transaction = await storage.createTransaction({
        ...req.body,
        createdById: (req.user as any).id
      });
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar transação" });
    }
  });

  app.put("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const transaction = await storage.updateTransaction(id, req.body);
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar transação" });
    }
  });

  app.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      res.json({ message: "Transação excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir transação" });
    }
  });

  // Backups
  app.get("/api/backups", isAdmin, async (req, res) => {
    try {
      const backups = await storage.listBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar backups" });
    }
  });

  app.post("/api/backups", isAdmin, validateBody(insertBackupSchema), async (req, res) => {
    try {
      const filename = `backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
      const backup = await storage.createBackup({
        filename,
        name: req.body.name,
        description: req.body.description,
        createdById: (req.user as any).id,
        automatic: req.body.automatic || false
      });
      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar backup" });
    }
  });
  
  // Documents Routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.listDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar documentos" });
    }
  });
  
  app.get("/api/cases/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const documents = await storage.listDocumentsByCase(id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar documentos do processo" });
    }
  });
  
  app.get("/api/clients/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const documents = await storage.listDocumentsByClient(id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar documentos do cliente" });
    }
  });
  
  app.post("/api/documents", isAuthenticated, validateBody(insertDocumentSchema), async (req, res) => {
    try {
      const document = await storage.createDocument({
        ...req.body,
        uploadedById: (req.user as any).id
      });
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar documento" });
    }
  });
  
  app.put("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const document = await storage.updateDocument(id, req.body);
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar documento" });
    }
  });
  
  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }
      res.json({ message: "Documento excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir documento" });
    }
  });
  
  // Quick Actions Routes
  app.get("/api/quick-actions", isAuthenticated, async (req, res) => {
    try {
      const quickActions = await storage.listQuickActions();
      res.json(quickActions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar ações rápidas" });
    }
  });
  
  app.post("/api/quick-actions", isAuthenticated, validateBody(insertQuickActionSchema), async (req, res) => {
    try {
      const quickAction = await storage.createQuickAction({
        ...req.body,
        createdById: (req.user as any).id
      });
      res.status(201).json(quickAction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar ação rápida" });
    }
  });
  
  app.put("/api/quick-actions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const quickAction = await storage.updateQuickAction(id, req.body);
      if (!quickAction) {
        return res.status(404).json({ message: "Ação rápida não encontrada" });
      }
      res.json(quickAction);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar ação rápida" });
    }
  });
  
  app.delete("/api/quick-actions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const success = await storage.deleteQuickAction(id);
      if (!success) {
        return res.status(404).json({ message: "Ação rápida não encontrada" });
      }
      res.json({ message: "Ação rápida excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir ação rápida" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
