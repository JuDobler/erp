import { 
  legalAreaLabels, 
  leadOriginLabels, 
  leadStatusLabels, 
  taskPriorityLabels, 
  userRoleLabels 
} from "@shared/schema";

// Legal Areas
export const LEGAL_AREAS = [
  { value: 'direito_bancario', label: legalAreaLabels.direito_bancario },
  { value: 'direito_empresarial', label: legalAreaLabels.direito_empresarial },
  { value: 'direito_civil', label: legalAreaLabels.direito_civil },
  { value: 'direito_criminal', label: legalAreaLabels.direito_criminal },
  { value: 'direito_administrativo', label: legalAreaLabels.direito_administrativo },
  { value: 'direito_consumidor', label: legalAreaLabels.direito_consumidor },
  { value: 'outros', label: legalAreaLabels.outros },
];

// Lead Origins
export const LEAD_ORIGINS = [
  { value: 'site', label: leadOriginLabels.site },
  { value: 'indicacao', label: leadOriginLabels.indicacao },
  { value: 'instagram', label: leadOriginLabels.instagram },
  { value: 'tiktok', label: leadOriginLabels.tiktok },
  { value: 'facebook', label: leadOriginLabels.facebook },
  { value: 'google', label: leadOriginLabels.google },
  { value: 'outros', label: leadOriginLabels.outros },
];

// Lead Statuses with their respective colors
export const LEAD_STATUSES = [
  { value: 'novo', label: leadStatusLabels.novo, color: 'bg-blue-500' },
  { value: 'em_contato', label: leadStatusLabels.em_contato, color: 'bg-indigo-500' },
  { value: 'proposta_enviada', label: leadStatusLabels.proposta_enviada, color: 'bg-yellow-500' },
  { value: 'negociacao', label: leadStatusLabels.negociacao, color: 'bg-orange-500' },
  { value: 'convertido', label: leadStatusLabels.convertido, color: 'bg-green-500' },
  { value: 'perdido', label: leadStatusLabels.perdido, color: 'bg-red-500' },
];

// Task Priority
export const TASK_PRIORITIES = [
  { value: 'baixa', label: taskPriorityLabels.baixa, color: 'bg-green-500' },
  { value: 'media', label: taskPriorityLabels.media, color: 'bg-blue-500' },
  { value: 'alta', label: taskPriorityLabels.alta, color: 'bg-yellow-500' },
  { value: 'urgente', label: taskPriorityLabels.urgente, color: 'bg-red-500' },
];

// User Roles
export const USER_ROLES = [
  { value: 'admin', label: userRoleLabels.admin },
  { value: 'advogado', label: userRoleLabels.advogado },
  { value: 'financeiro', label: userRoleLabels.financeiro },
  { value: 'secretaria', label: userRoleLabels.secretaria },
  { value: 'estagiario', label: userRoleLabels.estagiario },
];

// Date formatter
export const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// Date and time formatter
export const DATETIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Currency formatter
export const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Navigation items used in the sidebar
export const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'home',
  },
  {
    href: '/crm',
    label: 'CRM',
    icon: 'users',
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: 'users',
  },
  {
    href: '/cases',
    label: 'Casos',
    icon: 'briefcase',
  },
  {
    href: '/tasks',
    label: 'Tarefas',
    icon: 'check-square',
  },
  {
    href: '/documents',
    label: 'Documentos',
    icon: 'file-text',
  },
  {
    href: '/financial',
    label: 'Financeiro',
    icon: 'dollar-sign',
  },
  {
    href: '/quick-actions',
    label: 'Ações Rápidas',
    icon: 'zap',
  },
  {
    href: '/reports',
    label: 'Relatórios',
    icon: 'bar-chart-2',
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: 'settings',
  },
];
