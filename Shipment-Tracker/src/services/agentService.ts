import { Agent } from '../types';

export const mockAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Xavier Pallarès',
    role: 'Global Logistics Manager',
    region: 'Europe/HQ',
    email: 'xpallares@example.com',
    phone: '+34 600 000 000',
    status: 'active',
    specialties: ['Customs', 'Air Freight']
  },
  {
    id: 'a2',
    name: 'Li Wei',
    role: 'Asia Operations Lead',
    region: 'Shanghai/Ningbo',
    email: 'l.wei@example.com',
    phone: '+86 21 0000 0000',
    status: 'active',
    specialties: ['Sea Export', 'Warehouse']
  },
  {
    id: 'a3',
    name: 'Carlos Rodriguez',
    role: 'LATAM Agent',
    region: 'Mexico/Panama',
    email: 'c.rodriguez@example.com',
    phone: '+52 55 0000 0000',
    status: 'away',
    specialties: ['Trucking', 'Port Ops']
  }
];

export const AgentService = {
  getAgents(): Agent[] {
    return mockAgents;
  }
};



