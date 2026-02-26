/**
 * Seed data for testing and development
 */

export type ApplicationStatus =
  | 'bookmarked'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'archived';

export type ApplicationWorkType =
  | "remote"
  | "hybrid-1day"
  | "hybrid-2day"
  | "hybrid-3day"
  | "hybrid-4day"
  | "onsite"

export type ApplicationEmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"

export type ApplicationInterest =
  | "low"
  | "medium"
  | "high"
  | "dream"

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period?: 'hourly' | 'annual';
}

export interface Application {
  id?: string;
  company_id?: string;
  position: string;
  status: ApplicationStatus;
  interest?: ApplicationInterest;
  work_type?: ApplicationWorkType;
  employment_type?: ApplicationEmploymentType;
  location?: string;
  salary?: SalaryRange;
  url?: string;
  job_description?: string;
  source?: string;
  tags?: string[];
  applied_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  archived_reason?: string
  notes?: string;
}

export interface Company {
  id?: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  founded?: Date;
  links?: {
    website?: string;
    careers?: string;
    news?: string;
    linkedin?: string;
    glassdoor?: string;
    crunchbase?: string;
  };
  culture?: string;
  benefits?: string;
  pros?: string;
  cons?: string;
  techStack?: string;
  ratings?: {
    overall?: number;
    workLifeBalance?: number;
    compensation?: number;
    careerGrowth?: number;
    management?: number;
    culture?: number;
  };
  tags?: string[];
  researched: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type EventType =
  | "screening-interview"
  | "technical-interview"
  | "behavioral-interview"
  | "online-test"
  | "take-home"
  | "onsite"

export type EventStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "availability-requested"
  | "availability-submitted"
  | "no-show"

export interface Event {
  id?: string;
  application_id?: string;
  type: EventType
  status: EventStatus;
  url?: string;
  title?: string;
  description?: string
  duration_minutes?: number;
  scheduled_at?: Date;
  notes?: string
  created_at?: Date;
  updated_at?: Date;
}

export interface Contact {
  id?: string;
  name: string;
  company_id?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Document {
  id?: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'other';
  content?: string;
  uri?: string;
  mime_type?: string;
  revision?: number;
  parent_id?: string;
  tags?: string[];
  notes?: string;
  archived_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}


const sampleApplications: Array<Application> = [
    {
      position: 'Senior Frontend Developer',
      status: 'interviewing',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      salary: {
        min: 120000,
        max: 160000,
        currency: 'USD',
      },
      url: 'https://techcorp.com/jobs/123',
      applied_at: new Date('2024-01-15'),
      tags: ['react', 'typescript', 'remote'],
      notes: 'Really excited about this opportunity. Contacted recruiter.',
    },
    {
      position: 'Full Stack Engineer',
      status: 'interviewing',
      interest: 'medium',
      work_type: 'hybrid-1day',
      employment_type: 'full-time',
      location: 'New York, NY',
      salary: {
        min: 100000,
        max: 140000,
        currency: 'USD',
      },
      applied_at: new Date('2024-01-20'),
      tags: ['node', 'react', 'mongodb'],
    },
    {
      position: 'React Developer',
      status: 'offer',
      interest: 'high',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Seattle, WA',
      salary: {
        min: 150000,
        max: 180000,
        currency: 'USD',
      },
      applied_at: new Date('2024-01-05'),
      tags: ['react', 'redux', 'graphql'],
      notes: 'Received offer! Need to respond by Feb 5th.',
    },
    {
      position: 'Software Engineer',
      status: 'interviewing',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Austin, TX',
      applied_at: new Date('2025-10-28'),
      tags: ['aws', 'microservices'],
      notes: 'Excited about the cloud infrastructure focus.',
    },
    {
      position: 'Frontend Architect',
      status: 'rejected',
      interest: 'low',
      work_type: 'hybrid-2day',
      employment_type: 'contract',
      location: 'Boston, MA',
      salary: {
        min: 90,
        max: 120,
        currency: 'USD',
      },
      applied_at: new Date('2024-01-10'),
      tags: ['angular', 'rxjs'],
    },
    {
      position: 'UI/UX Engineer',
      status: 'interviewing',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      applied_at: new Date('2025-10-20'),
      tags: ['design-systems', 'react', 'figma'],
      notes: 'Dream company! Excited about the interview.',
    },
    {
      position: 'JavaScript Developer',
      status: 'accepted',
      interest: 'high',
      work_type: 'hybrid-3day',
      employment_type: 'full-time',
      location: 'Chicago, IL',
      salary: {
        min: 130000,
        max: 150000,
        currency: 'USD',
      },
      applied_at: new Date('2023-12-20'),
      tags: ['typescript', 'vue', 'jest'],
      notes: 'Accepted offer! Start date Feb 15th.',
    },
    {
      position: 'React Native Developer',
      status: 'offer',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Los Angeles, CA',
      applied_at: new Date('2024-01-08'),
      tags: ['react-native', 'mobile'],
      notes: 'Withdrew application - accepted another offer.',
    },
    // More recent applications for analytics (June - October 2025)
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 110000,
        max: 140000,
        currency: 'USD',
      },
      applied_at: new Date('2025-06-15'),
      tags: ['react', 'javascript', 'css'],
      notes: 'Applied through LinkedIn',
    },
    {
      position: 'Full Stack Developer',
      status: 'rejected',
      interest: 'high',
      work_type: 'hybrid-4day',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      salary: {
        min: 140000,
        max: 180000,
        currency: 'USD',
      },
      applied_at: new Date('2025-07-01'),
      tags: ['python', 'react', 'ai', 'ml'],
      notes: 'Rejected after initial screening - position filled internally',
    },
    {
      position: 'Software Engineer',
      status: 'interviewing',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Portland, OR',
      salary: {
        min: 125000,
        max: 155000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-10'),
      tags: ['sustainability', 'typescript', 'node'],
      notes: 'Passionate about their environmental mission',
    },
    {
      position: 'Senior Frontend Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'New York, NY',
      salary: {
        min: 145000,
        max: 175000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-22'),
      tags: ['react', 'finance', 'typescript'],
    },
    {
      position: 'UI Developer',
      status: 'rejected',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      applied_at: new Date('2025-09-05'),
      tags: ['ui', 'css', 'design'],
      notes: 'Not a good fit for experience level',
    },
    {
      position: 'Frontend Architect',
      status: 'interviewing',
      interest: 'high',
      work_type: 'hybrid-4day',
      employment_type: 'full-time',
      location: 'Los Angeles, CA',
      salary: {
        min: 160000,
        max: 200000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-18'),
      tags: ['streaming', 'performance', 'react'],
      notes: 'Exciting opportunity in media streaming',
    },
    {
      position: 'Senior Software Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 130000,
        max: 160000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-01'),
      tags: ['education', 'react', 'node'],
      notes: 'Mission-driven company focused on education',
    },
    {
      position: 'Full Stack Engineer',
      status: 'interviewing',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Austin, TX',
      salary: {
        min: 135000,
        max: 170000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-08'),
      tags: ['security', 'typescript', 'golang'],
      notes: 'Strong security focus - interesting tech stack',
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'high',
      work_type: 'hybrid-1day',
      employment_type: 'full-time',
      location: 'Boston, MA',
      salary: {
        min: 125000,
        max: 150000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-15'),
      tags: ['healthcare', 'react', 'hipaa'],
      notes: 'Healthcare technology - making an impact',
    },
    {
      position: 'Web Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Seattle, WA',
      applied_at: new Date('2025-10-20'),
      tags: ['gaming', 'webgl', 'three.js'],
      notes: 'Would be cool to work in gaming',
    },

    // Additional applications for tripling count (36 more)
    {
      position: 'Backend Developer',
      status: 'rejected',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      salary: {
        min: 115000,
        max: 145000,
        currency: 'USD',
      },
      applied_at: new Date('2025-05-10'),
      tags: ['node', 'python', 'aws'],
      notes: 'Different position at same company',
    },
    {
      position: 'DevOps Engineer',
      status: 'rejected',
      interest: 'low',
      work_type: 'hybrid-2day',
      employment_type: 'full-time',
      location: 'New York, NY',
      applied_at: new Date('2025-06-20'),
      tags: ['kubernetes', 'docker', 'ci-cd'],
    },
    {
      position: 'Software Engineer II',
      status: 'applied',
      interest: 'high',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Seattle, WA',
      salary: {
        min: 140000,
        max: 170000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-25'),
      tags: ['java', 'microservices', 'azure'],
    },
    {
      position: 'UI Engineer',
      status: 'rejected',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'contract',
      location: 'Remote',
      applied_at: new Date('2025-07-05'),
      tags: ['css', 'design', 'react'],
      notes: 'Contract position - not interested anymore',
    },
    {
      position: 'Platform Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Austin, TX',
      salary: {
        min: 130000,
        max: 160000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-18'),
      tags: ['aws', 'terraform', 'kubernetes'],
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Boston, MA',
      salary: {
        min: 120000,
        max: 150000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-15'),
      tags: ['react', 'data-viz', 'd3'],
      notes: 'Data visualization focus',
    },
    {
      position: 'Senior Software Engineer',
      status: 'rejected',
      interest: 'high',
      work_type: 'hybrid-3day',
      employment_type: 'full-time',
      location: 'San Jose, CA',
      salary: {
        min: 160000,
        max: 200000,
        currency: 'USD',
      },
      applied_at: new Date('2025-07-20'),
      tags: ['react', 'node', 'postgres'],
      notes: 'Position filled internally',
    },
    {
      position: 'Full Stack Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'New York, NY',
      applied_at: new Date('2025-10-05'),
      tags: ['angular', 'java', 'spring'],
    },
    {
      position: 'Frontend Engineer',
      status: 'applied',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 110000,
        max: 140000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-10'),
      tags: ['vue', 'typescript', 'real-estate'],
    },
    {
      position: 'Software Engineer',
      status: 'rejected',
      interest: 'medium',
      work_type: 'hybrid-4day',
      employment_type: 'full-time',
      location: 'Denver, CO',
      applied_at: new Date('2025-06-10'),
      tags: ['react', 'maps', 'travel'],
      notes: 'Not moving forward',
    },
    {
      position: 'Lead Frontend Developer',
      status: 'applied',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 145000,
        max: 175000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-12'),
      tags: ['react', 'leadership', 'education'],
    },
    {
      position: 'Web Developer',
      status: 'rejected',
      interest: 'low',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Pittsburgh, PA',
      applied_at: new Date('2025-05-25'),
      tags: ['javascript', 'robotics', 'iot'],
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'hybrid-1day',
      employment_type: 'full-time',
      location: 'Los Angeles, CA',
      salary: {
        min: 115000,
        max: 145000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-20'),
      tags: ['react', 'e-commerce', 'fashion'],
    },
    {
      position: 'Machine Learning Engineer',
      status: 'applied',
      interest: 'high',
      work_type: 'hybrid-2day',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      salary: {
        min: 150000,
        max: 190000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-10'),
      tags: ['python', 'ml', 'pytorch'],
      notes: 'Different role - more ML focused',
    },
    {
      position: 'Software Engineer',
      status: 'rejected',
      interest: 'high',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Menlo Park, CA',
      salary: {
        min: 170000,
        max: 210000,
        currency: 'USD',
      },
      applied_at: new Date('2025-06-01'),
      tags: ['react', 'graphql', 'social'],
      notes: 'Failed system design round',
    },
    {
      position: 'Senior Frontend Engineer',
      status: 'applied',
      interest: 'high',
      work_type: 'hybrid-3day',
      employment_type: 'full-time',
      location: 'Boston, MA',
      salary: {
        min: 140000,
        max: 170000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-22'),
      tags: ['react', 'healthcare', 'senior'],
    },
    {
      position: 'Full Stack Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Chicago, IL',
      salary: {
        min: 125000,
        max: 155000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-01'),
      tags: ['node', 'react', 'logistics'],
    },
    {
      position: 'Software Developer',
      status: 'rejected',
      interest: 'low',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'San Diego, CA',
      applied_at: new Date('2025-07-15'),
      tags: ['python', 'biotech', 'data'],
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Portland, OR',
      salary: {
        min: 120000,
        max: 145000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-25'),
      tags: ['react', 'sustainability', 'clean-energy'],
    },
    {
      position: 'Web Developer',
      status: 'rejected',
      interest: 'low',
      work_type: 'hybrid-4day',
      employment_type: 'full-time',
      location: 'Atlanta, GA',
      applied_at: new Date('2025-06-15'),
      tags: ['react', 'sports', 'analytics'],
    },
    {
      position: 'Senior Software Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 135000,
        max: 165000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-15'),
      tags: ['typescript', 'insurance', 'react'],
    },
    {
      position: 'Frontend Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'hybrid-1day',
      employment_type: 'full-time',
      location: 'Nashville, TN',
      salary: {
        min: 115000,
        max: 140000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-08'),
      tags: ['react', 'music', 'audio'],
    },
    {
      position: 'Software Engineer',
      status: 'rejected',
      interest: 'low',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Miami, FL',
      applied_at: new Date('2025-05-15'),
      tags: ['react', 'maps', 'real-estate'],
    },
    {
      position: 'Full Stack Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 110000,
        max: 135000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-05'),
      tags: ['node', 'react', 'agriculture'],
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Washington, DC',
      salary: {
        min: 125000,
        max: 150000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-28'),
      tags: ['react', 'legal', 'compliance'],
    },
    {
      position: 'Software Engineer',
      status: 'rejected',
      interest: 'medium',
      work_type: 'hybrid-2day',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      applied_at: new Date('2025-06-25'),
      tags: ['react', 'advertising', 'analytics'],
    },
    {
      position: 'Frontend Engineer',
      status: 'applied',
      interest: 'low',
      work_type: 'hybrid-3day',
      employment_type: 'full-time',
      location: 'San Francisco, CA',
      salary: {
        min: 130000,
        max: 160000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-01'),
      tags: ['react', 'maps', 'food-delivery'],
    },
    {
      position: 'Web Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      applied_at: new Date('2025-08-20'),
      tags: ['react', 'marketing', 'analytics'],
    },
    {
      position: 'Software Engineer',
      status: 'rejected',
      interest: 'high',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Detroit, MI',
      salary: {
        min: 130000,
        max: 165000,
        currency: 'USD',
      },
      applied_at: new Date('2025-07-10'),
      tags: ['javascript', 'automotive', 'iot'],
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 105000,
        max: 130000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-05'),
      tags: ['react', 'pets', 'e-commerce'],
    },
    {
      position: 'Software Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'hybrid-4day',
      employment_type: 'full-time',
      location: 'New York, NY',
      salary: {
        min: 120000,
        max: 145000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-14'),
      tags: ['react', 'cms', 'news'],
    },
    {
      position: 'Full Stack Developer',
      status: 'rejected',
      interest: 'low',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Dallas, TX',
      applied_at: new Date('2025-05-20'),
      tags: ['node', 'react', 'construction'],
    },
    {
      position: 'Software Developer',
      status: 'applied',
      interest: 'medium',
      work_type: 'onsite',
      employment_type: 'full-time',
      location: 'Houston, TX',
      salary: {
        min: 125000,
        max: 155000,
        currency: 'USD',
      },
      applied_at: new Date('2025-08-10'),
      tags: ['javascript', 'aerospace', 'data-viz'],
    },
    {
      position: 'Frontend Engineer',
      status: 'applied',
      interest: 'medium',
      work_type: 'hybrid-1day',
      employment_type: 'full-time',
      location: 'Minneapolis, MN',
      salary: {
        min: 115000,
        max: 140000,
        currency: 'USD',
      },
      applied_at: new Date('2025-09-18'),
      tags: ['react', 'retail', 'pos'],
    },
    {
      position: 'Senior Software Engineer',
      status: 'rejected',
      interest: 'high',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 150000,
        max: 190000,
        currency: 'USD',
      },
      applied_at: new Date('2025-06-05'),
      tags: ['typescript', 'blockchain', 'crypto'],
      notes: 'Market volatility concerns',
    },
    {
      position: 'Frontend Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'remote',
      employment_type: 'full-time',
      location: 'Remote',
      salary: {
        min: 110000,
        max: 135000,
        currency: 'USD',
      },
      applied_at: new Date('2025-10-16'),
      tags: ['react', 'hr', 'saas'],
    },
    {
      position: 'Web Developer',
      status: 'applied',
      interest: 'low',
      work_type: 'hybrid-2day',
      employment_type: 'contract',
      location: 'Las Vegas, NV',
      applied_at: new Date('2025-09-22'),
      tags: ['javascript', 'events', 'ticketing'],
    },
  ];

const sampleCompanies: Array<Company> = [
    {
      id: 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      name: 'TechCorp Inc',
      industry: "Analytics",
      size: '1000-5000',
      location: 'San Francisco, CA',
      founded: new Date('2010-01-01'),
      description:
        'Leading cloud infrastructure provider specializing in scalable web applications',
      techStack: 'React, TypeScript, AWS, Kubernetes',
      researched: true,
      ratings: {
        overall: 4.2,
        workLifeBalance: 4.0,
        compensation: 4.5,
        careerGrowth: 4.3,
        culture: 4.0,
        management: 4.1,
      },
    },
    {
      id: "29d82696-d691-49ec-bcd9-dc1a9c2aadcc",
      name: 'StartupXYZ',
      industry: "Engineering, Product and Design",
      size: '50-200',
      location: 'New York, NY',
      founded: new Date('2020-01-01'),
      description: 'Innovative fintech startup disrupting payments with cutting-edge technology',
      techStack: 'Node.js, React, MongoDB, GraphQL',
      researched: true,
      ratings: {
        overall: 3.8,
        workLifeBalance: 3.5,
        compensation: 4.0,
        culture: 3.6,
        management: 3.4,
      },
    },
    {
      id: "9b4bf110-deb1-4481-8056-d040a57fd757",
      name: 'BigTech Solutions',
      industry: "Finance and Accounting",
      size: '10000+',
      location: 'Seattle, WA',
      founded: new Date('1998-01-01'),
      description: 'Global enterprise software leader with comprehensive business solutions',
      techStack: 'React, Redux, GraphQL, Azure',
      researched: true,
      ratings: {
        overall: 4.5,
        workLifeBalance: 4.2,
        compensation: 4.8,
        careerGrowth: 4.6,
        culture: 4.3,
        management: 4.4,
      },
    },
    {
      id: "4769b594-1f5a-4207-8123-deea2272668d",
      name: 'CloudScale Systems',
      industry: "Human Resources",
      size: '500-1000',
      location: 'Austin, TX',
      founded: new Date('2015-01-01'),
      description: 'Cloud-native platform for building and deploying microservices at scale',
      techStack: 'AWS, Docker, Kubernetes, Go, Python',
      researched: true,
      ratings: {
        overall: 4.1,
        workLifeBalance: 4.3,
        compensation: 4.2,
        careerGrowth: 4.0,
        culture: 4.2,
        management: 4.0,
      },
    },
    {
      id: "71a24a14-8c4f-45ca-8193-ed3ffb709072",
      name: 'InnovateLabs',
      industry: "Infrastructure",
      size: '200-500',
      location: 'Remote',
      founded: new Date('2018-01-01'),
      description: 'Design systems company creating beautiful, accessible user interfaces',
      techStack: 'React, Figma, Storybook, TypeScript, CSS-in-JS',
      researched: true,
      ratings: {
        overall: 4.4,
        workLifeBalance: 4.6,
        compensation: 4.1,
        careerGrowth: 4.2,
        culture: 4.5,
        management: 4.2,
      },
    },
    {
      id: "834e566f-4e01-4844-a7b6-eaf8025f81b0",
      name: 'GreenTech Solutions',
      industry: "Legal",
      size: '200-500',
      location: 'Portland, OR',
      founded: new Date('2019-01-01'),
      description:
        'Building technology solutions for environmental sustainability and climate action',
      techStack: 'TypeScript, Node.js, React, PostgreSQL',
      researched: true,
      ratings: {
        overall: 4.0,
        workLifeBalance: 4.4,
        compensation: 3.7,
        careerGrowth: 3.9,
        culture: 4.1,
        management: 3.8,
      },
    },
    {
      id: "f7219323-187e-47ba-9d65-8a0a1953c3d1",
      name: 'MediaStream Co',
      industry: "Marketing",
      size: '1000-5000',
      location: 'Los Angeles, CA',
      founded: new Date('2012-01-01'),
      description: 'Leading video streaming platform delivering high-quality content globally',
      techStack: 'React, WebRTC, CDN, Node.js, FFmpeg',
      researched: true,
      ratings: {
        overall: 4.3,
        workLifeBalance: 3.8,
        compensation: 4.6,
        careerGrowth: 4.4,
        culture: 4.1,
        management: 4.0,
      },
    },
    {
      id: "f4d4155e-e02a-4230-8684-2da4a79d9b46",
      name: 'CyberSecure Systems',
      industry: "Office Management",
      size: '500-1000',
      location: 'Austin, TX',
      founded: new Date('2016-01-01'),
      description: 'Cybersecurity solutions protecting businesses from modern threats',
      techStack: 'TypeScript, Go, Rust, Kubernetes, Zero Trust',
      researched: true,
      ratings: {
        overall: 4.2,
        workLifeBalance: 4.0,
        compensation: 4.4,
        careerGrowth: 4.1,
        culture: 4.0,
        management: 4.1,
      },
    },
    {
      id: "42228724-76ee-463e-9ea4-c5d0dc4142a6",
      name: 'HealthTech Innovations',
      industry: "Operations",
      size: '500-1000',
      location: 'Boston, MA',
      founded: new Date('2017-01-01'),
      description: 'Healthcare technology improving patient outcomes through digital solutions',
      techStack: 'React, HIPAA-compliant, FHIR, Node.js, AWS',
      researched: false,
      ratings: {
        overall: 3.9,
        workLifeBalance: 4.1,
        compensation: 4.0,
        culture: 3.8,
        management: 3.7,
      },
    },
    {
      id: "de4a4b86-16e8-4131-bc47-71093119b869",
      name: 'AI Innovations',
      industry: "Productivity",
      size: '200-500',
      location: 'San Francisco, CA',
      founded: new Date('2021-01-01'),
      description: 'Cutting-edge AI and machine learning solutions for enterprise',
      techStack: 'Python, TensorFlow, PyTorch, React, Kubernetes',
      researched: true,
      ratings: {
        overall: 4.1,
        workLifeBalance: 3.6,
        compensation: 4.7,
        careerGrowth: 4.5,
        culture: 4.0,
        management: 3.9,
      },
    },
    {
      id: "55bc02c0-f600-4b25-9e0a-1c51504ae241",
      name: 'EduTech Platform',
      industry: "Recruiting and Talent",
      size: '500-1000',
      location: 'Remote',
      founded: new Date('2018-01-01'),
      description: 'Online learning platform making education accessible to everyone',
      techStack: 'React, Node.js, MongoDB, WebRTC, LMS',
      researched: false,
      ratings: {
        overall: 3.8,
        workLifeBalance: 4.2,
        compensation: 3.6,
        culture: 3.9,
        management: 3.6,
      },
    },
    {
      id: "fd9b24f0-8f72-4aeb-a8a3-23b91f420a11",
      name: 'FinServ Tech',
      industry: "Retail",
      size: '1000-5000',
      location: 'New York, NY',
      founded: new Date('2005-01-01'),
      description: 'Financial services technology powering modern banking',
      techStack: 'React, TypeScript, Java, Microservices',
      researched: false,
      ratings: {
        overall: 3.9,
        workLifeBalance: 3.5,
        compensation: 4.5,
        culture: 3.7,
        management: 3.6,
      },
    },
    {
      id: "cba81a67-8f47-4089-8aba-886e8d36d9b9",
      name: 'GameDev Studios',
      industry: "Sales",
      size: '200-500',
      location: 'Seattle, WA',
      founded: new Date('2014-01-01'),
      description: 'Game development studio creating immersive web-based gaming experiences',
      techStack: 'Three.js, WebGL, React, WebAssembly, Unity',
      researched: false,
      ratings: {
        overall: 4.0,
        workLifeBalance: 3.4,
        compensation: 3.8,
        culture: 3.8,
        management: 3.5,
      },
    },
  ];

const sampleContacts: Array<Contact> = [
    {
      name: 'Sarah Johnson',
      company_id: 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      title: 'Senior Recruiter',
      email: 'sarah.johnson@techcorp.com',
      linkedin_url: 'https://linkedin.com/in/sarahjohnson',
      notes: 'Very responsive, initial contact via LinkedIn',
    },
    {
      name: 'Michael Chen',
      company_id: 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      title: 'Engineering Manager',
      email: 'michael.chen@bigtech.com',
      linkedin_url: 'https://linkedin.com/in/michaelchen',
      notes: 'Will be conducting technical interview',
    },
    {
      name: 'Emily Rodriguez',
      company_id: "29d82696-d691-49ec-bcd9-dc1a9c2aadcc",
      title: 'Software Engineer',
      email: 'emily@startupxyz.com',
      notes: 'Friend from university, provided referral',
    },
    {
      name: 'Tom Wilson',
      company_id: "834e566f-4e01-4844-a7b6-eaf8025f81b0",
      title: 'Engineering Manager',
      email: 'tom.wilson@greentech.com',
      linkedin_url: 'https://linkedin.com/in/tomwilson',
      notes: 'Passionate about environmental tech',
    },
    {
      name: 'Rachel Kim',
      company_id: "f7219323-187e-47ba-9d65-8a0a1953c3d1",
      title: 'Principal Engineer',
      email: 'rachel.kim@mediastream.co',
      linkedin_url: 'https://linkedin.com/in/rachelkim',
      notes: 'Expert in video streaming technology',
    },
    {
      name: 'Olivia Taylor',
      company_id: "71a24a14-8c4f-45ca-8193-ed3ffb709072",
      title: 'Design Systems Lead',
      email: 'olivia.taylor@innovatelabs.com',
      linkedin_url: 'https://linkedin.com/in/oliviataylor',
      notes: 'Leading the design systems team',
    },
    {
      name: 'Daniel Roberts',
      company_id: "f4d4155e-e02a-4230-8684-2da4a79d9b46",
      title: 'Security Architect',
      email: 'daniel.roberts@cybersecure.com',
      linkedin_url: 'https://linkedin.com/in/danielroberts',
      notes: 'Security expert with 15+ years experience',
    },
    {
      name: 'Marcus Johnson',
      company_id: "4769b594-1f5a-4207-8123-deea2272668d",
      title: 'Staff Engineer',
      email: 'marcus.johnson@cloudscale.io',
      linkedin_url: 'https://linkedin.com/in/marcusjohnson',
      notes: 'Met at a tech conference last year',
    },
    {
      name: 'Jessica Wang',
      company_id: "de4a4b86-16e8-4131-bc47-71093119b869",
      title: 'Technical Recruiter',
      email: 'jessica.wang@ai-innovations.com',
      notes: 'Initial phone screen contact',
    },
    {
      name: 'Kevin Martinez',
      company_id: "f7219323-187e-47ba-9d65-8a0a1953c3d1",
      title: 'Senior Recruiter',
      email: 'kevin.martinez@mediastream.co',
      notes: 'Friendly and professional recruiter',
    },
    {
      name: 'Amanda Lee',
      company_id: "f4d4155e-e02a-4230-8684-2da4a79d9b46",
      title: 'Engineering Manager',
      email: 'amanda.lee@cybersecure.com',
      linkedin_url: 'https://linkedin.com/in/amandalee',
      notes: 'Will conduct technical interview',
    },
    {
      name: 'Emma Brown',
      company_id: "834e566f-4e01-4844-a7b6-eaf8025f81b0",
      title: 'Talent Acquisition Specialist',
      email: 'emma.brown@greentech.com',
      notes: 'Great communication throughout process',
    },
  ];

const sampleInterviews: Array<Event> = [
    {
      type: 'screening-interview',
      status: 'completed',
      scheduled_at: new Date('2024-01-18'),
      duration_minutes: 30
    },
    {
      type: 'behavioral-interview',
      status: 'completed',
      scheduled_at: new Date('2024-01-10'),
      duration_minutes: 45
    },
    {
      type: 'technical-interview',
      status: 'completed',
      scheduled_at: new Date('2024-01-15'),
      duration_minutes: 90
    },
    // Upcoming Interviews
    {
      type: 'technical-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-25T14:00:00'),
      duration_minutes: 60,
      url: 'https://meet.google.com/abc-defg-hij'
    },
    {
      type: 'behavioral-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-28T10:30:00'),
      duration_minutes: 45,
      url: 'https://zoom.us/j/123456789'
    },
    {
      type: 'screening-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-24T15:00:00'),
      duration_minutes: 30
    },
    {
      type: 'onsite',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-30T13:00:00'),
      duration_minutes: 90
    },
    {
      type: 'behavioral-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-11-01T11:00:00'),
      duration_minutes: 60,
      url: 'https://meet.google.com/xyz-abcd-efg'
    },
    {
      type: 'technical-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-11-05T16:00:00'),
      duration_minutes: 75,
      url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting'
    },
    {
      type: 'onsite',
      status: 'scheduled',
      scheduled_at: new Date('2025-11-08T14:00:00'),
      duration_minutes: 30,
      url: 'https://meet.google.com/final-round-abc'
    },

    // More interviews for recent applications
    {
      type: 'screening-interview',
      status: 'completed',
      scheduled_at: new Date('2025-08-18'),
      duration_minutes: 30
    },
    {
      type: 'technical-interview',
      status: 'completed',
      scheduled_at: new Date('2025-09-05'),
      duration_minutes: 60
    },
    {
      type: 'behavioral-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-26T15:00:00'),
      duration_minutes: 45,
      url: 'https://zoom.us/j/greentech-interview'
    },
    {
      type: 'screening-interview',
      status: 'completed',
      scheduled_at: new Date('2025-09-25'),
      duration_minutes: 30
    },
    {
      type: 'technical-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-27T10:00:00'),
      duration_minutes: 75,
      url: 'https://meet.google.com/mediastream-tech'
    },
    {
      type: 'behavioral-interview',
      status: 'completed',
      scheduled_at: new Date('2025-10-14'),
      duration_minutes: 45
    },
    {
      type: 'technical-interview',
      status: 'scheduled',
      scheduled_at: new Date('2025-10-29T14:00:00'),
      duration_minutes: 90,
      url: 'https://teams.microsoft.com/cybersecure-interview'
    },
    {
      type: 'screening-interview',
      status: 'completed',
      scheduled_at: new Date('2025-07-08'),
      duration_minutes: 30
    },
    {
      type: 'behavioral-interview',
      status: 'completed',
      scheduled_at: new Date('2025-09-10'),
      duration_minutes: 30
    },
  ];

const sampleDocuments: Array<Document> = [
    // Resumes with version history
    {
      id: "bd48c3fb-8517-4467-86b4-91ca95faceba",
      name: 'Software Engineer Resume',
      type: 'resume',
      revision: 1,
      content:
        'PROFESSIONAL SUMMARY\n\nExperienced software engineer with 5+ years building web applications...\n\nSKILLS\n- JavaScript, React, Node.js\n- HTML, CSS, SQL',
      tags: ['tech', 'general'],
      notes: 'Initial resume version - too generic',
    },
    {
      id: "1dc79247-d306-454a-b039-b8569f1c483f",
      name: 'Software Engineer Resume',
      type: 'resume',
      revision: 2,
      parent_id: "bd48c3fb-8517-4467-86b4-91ca95faceba",
      content:
        'PROFESSIONAL SUMMARY\n\nSoftware Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...\n\nSKILLS\n- Frontend: React, TypeScript, Next.js, Redux\n- Backend: Node.js, Express, PostgreSQL\n- Cloud: AWS, Docker, Kubernetes',
      tags: ['tech', 'general', 'updated'],
      notes: 'Improved with metrics and specific technologies'
    },
    {
      id: "7aea7a25-c222-4b54-a262-3406c3be2097",
      name: 'Frontend Specialist Resume',
      type: 'resume',
      revision: 1,
      content:
        'PROFESSIONAL SUMMARY\n\nFrontend specialist with deep expertise in React, TypeScript...\n\nEXPERIENCE\nSenior Frontend Developer - Current Company (2022-Present)\n- Built responsive web applications',
      tags: ['frontend', 'react'],
      notes: 'First version - needs more detail',
    },
    {
      id: "18d07bb1-aa87-48b1-a5d1-8e058b535bed",
      name: 'Frontend Specialist Resume',
      type: 'resume',
      revision: 2,
      parent_id: "1dc79247-d306-454a-b039-b8569f1c483f",
      content:
        'PROFESSIONAL SUMMARY\n\nFrontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...\n\nEXPERIENCE\nSenior Frontend Developer - Current Company (2022-Present)\n- Built 15+ responsive web applications serving 100K+ users\n- Reduced initial load time by 40% through code splitting and optimization\n- Led migration from JavaScript to TypeScript across 50+ components',
      tags: ['frontend', 'react', 'senior'],
      notes: 'Enhanced with metrics and achievements'
    },
    {
      id: "bef42652-e0b3-451f-90b3-3241a994b340",
      name: 'Full Stack Resume',
      type: 'resume',
      revision: 1,
      content:
        'PROFESSIONAL SUMMARY\n\nVersatile full stack engineer comfortable working across the entire technology stack...\n\nSKILLS\n- Frontend: React, Vue.js, Angular\n- Backend: Node.js, Python, Java\n- Database: PostgreSQL, MongoDB, Redis\n- DevOps: Docker, CI/CD, AWS',
      tags: ['fullstack', 'backend', 'frontend'],
      notes: 'Comprehensive full stack resume'
    },

    // Cover Letters with versions
    {
      id: "7039c702-a60f-4329-8da7-31d323fa9de5",
      name: 'TechCorp Cover Letter',
      type: 'cover-letter',
      revision: 1,
      content:
        'Dear Hiring Manager,\n\nI am excited to apply for the Senior Frontend Developer position at TechCorp...',
      tags: ['techcorp', 'draft'],
      notes: 'Initial draft - too generic',
    },
    {
      name: 'TechCorp Cover Letter',
      type: 'cover-letter',
      revision: 2,
      parent_id: "7aea7a25-c222-4b54-a262-3406c3be2097",
      content:
        'Dear Sarah Johnson,\n\nI am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.\n\nYour focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...\n\nBest regards,\n[Your Name]',
      tags: ['techcorp', 'final'],
      notes: 'Personalized with recruiter name and company specifics'
    },
    {
      name: 'StartupXYZ Cover Letter',
      type: 'cover-letter',
      revision: 1,
      content:
        'Dear Hiring Team,\n\nI am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.\n\nMy experience with Node.js, React, and MongoDB makes me well-suited for this role...\n\nSincerely,\n[Your Name]',
      tags: ['startup', 'fintech'],
      notes: 'Tailored for startup culture and fintech focus'
    },
    {
      name: 'BigTech Cover Letter',
      type: 'cover-letter',
      revision: 1,
      content:
        "Dear Michael Chen,\n\nI am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.\n\nYour company's commitment to engineering excellence and innovation resonates with my professional values...\n\nBest regards,\n[Your Name]",
      tags: ['bigtech', 'enterprise'],
      notes: 'Emphasizes enterprise experience and scale'
    },

    // Portfolio and other documents
    {
      name: 'Portfolio Website',
      type: 'other',
      revision: 1,
      tags: ['portfolio', 'projects'],
      notes: 'Link to live portfolio website with project showcases'
    },
    {
      name: 'GitHub Portfolio',
      type: 'other',
      revision: 1,
      uri: 'https://github.com/yourname',
      content:
        'GitHub Profile\n\nOpen Source Contributions:\n- React Component Library (2.3k stars)\n- TypeScript Utilities Package (890 stars)\n- Code review participation in 50+ repositories',
      tags: ['github', 'opensource'],
      notes: 'GitHub profile with open source contributions'
    },
    {
      name: 'AWS Solutions Architect Certificate',
      type: 'other',
      revision: 1,
      uri: '/documents/aws-certification.pdf',
      mime_type: 'application/pdf',
      tags: ['aws', 'cloud', 'certification'],
      notes: 'AWS Solutions Architect Associate certification - Valid until Dec 2026'
    },
    {
      name: 'University Transcript',
      type: 'other',
      revision: 1,
      uri: '/documents/transcript.pdf',
      mime_type: 'application/pdf',
      tags: ['education', 'official'],
      notes: 'Official transcript - BS Computer Science, GPA 3.8'
    },
    {
      name: 'React Advanced Certification',
      type: 'other',
      revision: 1,
      mime_type: 'application/pdf',
      tags: ['react', 'frontend', 'certification'],
      notes: 'Advanced React Patterns and Performance certification'
    },
    {
      name: 'References List',
      type: 'other',
      revision: 1,
      content:
        'PROFESSIONAL REFERENCES\n\n1. Jane Smith - Former Manager\n   Senior Engineering Manager, Tech Company\n   jane.smith@example.com | (555) 123-4567\n\n2. Robert Johnson - Tech Lead\n   Principal Engineer, Innovation Labs\n   robert.j@example.com | (555) 234-5678\n\n3. Maria Garcia - Director of Engineering\n   VP Engineering, StartupCo\n   maria.garcia@example.com | (555) 345-6789',
      tags: ['references', 'contacts'],
      notes: 'Professional references - contacted all, confirmed availability'
    },
    {
      name: 'Side Projects Showcase',
      type: 'other',
      revision: 1,
      content:
        'SIDE PROJECTS\n\n1. Task Management App\n   - Full-stack React + Node.js application\n   - 500+ active users\n   - Tech: React, TypeScript, PostgreSQL, AWS\n\n2. Open Source Component Library\n   - 2.3k GitHub stars\n   - 50+ contributors\n   - Used by 100+ projects\n\n3. Dev Tools Chrome Extension\n   - 10k+ downloads\n   - 4.5 star rating',
      tags: ['projects', 'opensource', 'portfolio'],
      notes: 'Detailed side project documentation with links and metrics'
    },
    {
      name: 'Salary Research Document',
      type: 'other',
      revision: 1,
      content:
        'SALARY RESEARCH NOTES\n\nSenior Frontend Developer - Bay Area\n- Average: $150k-180k\n- Top companies: $180k-220k\n- Equity typically: 0.1-0.5%\n\nSources: Levels.fyi, Glassdoor, Blind',
      tags: ['research', 'salary', 'negotiation'],
      notes: 'Compiled salary research for negotiation preparation'
    },
    {
      name: 'Technical Blog Posts',
      type: 'other',
      revision: 1,
      content:
        'PUBLISHED TECHNICAL CONTENT\n\n- "Advanced React Patterns" (15k views)\n- "Building Scalable Frontend Architecture" (8k views)\n- "TypeScript Best Practices" (12k views)\n- "State Management Deep Dive" (6k views)',
      tags: ['blog', 'writing', 'technical'],
      notes: 'Technical blog with combined 50k+ views'
    },
    // Deleted/outdated documents
    {
      name: 'Old Resume 2020',
      type: 'resume',
      revision: 1,
      content: 'PROFESSIONAL SUMMARY\n\nJunior developer with 2 years experience...',
      tags: ['old', 'outdated'],
      notes: 'Outdated resume from 2020 - no longer relevant',
      archived_at: new Date('2024-12-01')
    },
    {
      name: 'Generic Cover Letter',
      type: 'cover-letter',
      revision: 1,
      content: 'To Whom It May Concern,\n\nI am writing to apply for the position...',
      tags: ['generic', 'template'],
      notes: 'Too generic - replaced with customized versions',
      archived_at: new Date('2024-11-15')
    },
    {
      name: 'Incomplete Project Portfolio',
      type: 'other',
      revision: 1,
      tags: ['incomplete', 'draft'],
      notes: 'Draft portfolio that was never completed',
      archived_at: new Date('2025-01-10')
    },
    {
      name: 'DataDriven Cover Letter Draft',
      type: 'cover-letter',
      revision: 1,
      content: 'Dear Hiring Manager,\n\nI am interested in the Frontend Architect position...',
      tags: ['draft', 'datadriven'],
      notes: 'Deleted after receiving rejection - no longer needed',
      archived_at: new Date('2024-01-12')
    },
    {
      name: 'Expired Security Clearance',
      type: 'other',
      revision: 1,
      tags: ['clearance', 'expired'],
      notes: 'Security clearance expired in 2023 - keeping for reference',
      archived_at: new Date('2024-10-01')
    },
    {
      name: 'Old Portfolio Website 2021',
      type: 'other',
      revision: 1,
      uri: 'https://old-portfolio.example.com',
      tags: ['outdated', 'portfolio'],
      notes: 'Old portfolio site - replaced with new design',
      archived_at: new Date('2024-11-20')
    },
    {
      name: 'Undergraduate Transcript',
      type: 'other',
      revision: 1,
      tags: ['education', 'old'],
      notes: 'Replaced with official transcript that includes graduate work',
      archived_at: new Date('2025-09-15')
    },
    {
      name: 'Old References 2022',
      type: 'other',
      revision: 1,
      content:
        'OLD REFERENCES\n\n1. John Doe - Former colleague (contact lost)\n2. Sarah Wilson - Moved to different company',
      tags: ['references', 'outdated'],
      notes: 'Outdated reference list - contacts no longer valid',
      archived_at: new Date('2024-12-20')
    },
];

export {
  sampleApplications,
  sampleCompanies,
  sampleContacts,
  sampleDocuments,
  sampleInterviews,
};
