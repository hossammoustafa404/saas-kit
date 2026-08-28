import {
  BarChart3,
  Bell,
  Lock,
  Plug,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export const PRODUCT_NAME = 'Pulse';

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingPricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface LandingStat {
  value: string;
  label: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: BarChart3,
    title: 'Real-time dashboards',
    description:
      'Track goals, KPIs, and team performance in one place with live updates and customizable views.',
  },
  {
    icon: Users,
    title: 'Team workspaces',
    description:
      'Organize people into workspaces, assign roles, and collaborate without stepping on each other.',
  },
  {
    icon: Workflow,
    title: 'Smart automations',
    description:
      'Automate repetitive workflows — status updates, notifications, and handoffs happen on autopilot.',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description:
      'Connect Slack, GitHub, Google Workspace, and dozens more tools your team already uses.',
  },
  {
    icon: Lock,
    title: 'Enterprise security',
    description:
      'SSO, audit logs, and granular permissions keep your data safe and compliance-ready.',
  },
  {
    icon: Bell,
    title: 'Actionable alerts',
    description:
      'Get notified when it matters — missed deadlines, blocked tasks, and milestone achievements.',
  },
];

export const LANDING_PRICING: LandingPricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'For individuals and small teams getting started.',
    features: [
      'Up to 5 team members',
      '3 workspaces',
      'Basic dashboards',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per user / month',
    description: 'For growing teams that need more power.',
    features: [
      'Unlimited team members',
      'Unlimited workspaces',
      'Advanced analytics',
      'Automations & integrations',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$79',
    period: 'per user / month',
    description: 'For organizations with advanced needs.',
    features: [
      'Everything in Pro',
      'SSO & SAML',
      'Audit logs',
      'Dedicated success manager',
      'Custom contracts',
    ],
  },
];

export const LANDING_STATS: LandingStat[] = [
  { value: '12k+', label: 'Teams worldwide' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'Customer rating' },
];

export const LANDING_NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
] as const;

export const LANDING_FOOTER_LINKS = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
] as const;
