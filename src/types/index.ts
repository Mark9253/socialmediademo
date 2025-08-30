export interface SocialPost {
  ID?: string; // Airtable record ID
  sourceHeadline: string;
  sourceSummary: string;
  goToArticle: string | { label?: string; url?: string }; // Can be string or object
  sourceURL: string | { label?: string; url?: string }; // Can be string or object
  socialChannels: string | string[]; // Can be string or array depending on source
  'needsImage?': string; // Airtable field with question mark
  imageSize: string;
  twitterCopy: string;
  linkedinCopy: string;
  instagramCopy: string;
  facebookCopy: string;
  blogCopy: string;
  imagePrompt: string;
  postImage: string | { id?: string; width?: number; height?: number; url?: string; filename?: string; size?: number; type?: string; thumbnails?: any };
  Status: string; // Note: Capital S to match your Airtable field
  datePosted?: string; // Changed to string to match Airtable format
  Created?: string; // Airtable auto-generated creation date
}

export interface BrandGuideline {
  guidelines?: string;
  Guidelines?: string; // Capital G for Airtable field
  imageStyle?: string;
  stylePrompt?: string;
  recordId?: string;
}

export interface WritingPrompt {
  channel: string;
  prompt: string;
  id?: string;
}

export interface MarketingVideoFolder {
  recordId?: string;
  'Marketing Shorts Folder': string;
  name?: string;
  url?: string;
}

export interface ContentGenerationRequest {
  sourceHeadline: string;
  sourceSummary: string;
  sourceURL: string;
  goToArticle: string;
  socialChannels: string[];
  needsImage: boolean;
}

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'blog';

export interface PlatformConfig {
  name: string;
  color: string;
  maxChars: number;
  icon: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'Twitter',
    color: 'platform-twitter',
    maxChars: 280,
    icon: 'Twitter'
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'platform-linkedin',
    maxChars: 3000,
    icon: 'Linkedin'
  },
  instagram: {
    name: 'Instagram',
    color: 'platform-instagram',
    maxChars: 2200,
    icon: 'Instagram'
  },
  facebook: {
    name: 'Facebook',
    color: 'platform-facebook',
    maxChars: 63206,
    icon: 'Facebook'
  },
  blog: {
    name: 'Blog',
    color: 'platform-blog',
    maxChars: 10000,
    icon: 'FileText'
  }
};