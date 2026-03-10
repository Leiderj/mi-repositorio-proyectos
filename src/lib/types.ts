export type TeamMember = {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  email: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  generalObjective: string;
  specificObjectives: string[];
  developmentMethod: string;
  locality: string; // parroquia
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  team: TeamMember[];
  files: ProjectFile[];
  trayecto: 'I' | 'II' | 'III' | 'IV';
  status: 'In Progress' | 'Completed' | 'Pending';
};
