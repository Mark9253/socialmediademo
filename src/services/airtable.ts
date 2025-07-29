import { AIRTABLE_BASE_URL, getHeaders, AIRTABLE_CONFIG } from '@/config/airtable';
import { SocialPost, BrandGuideline, WritingPrompt } from '@/types';

// Social Posts
export const fetchSocialPosts = async (): Promise<SocialPost[]> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}`, {
      headers: getHeaders()
    });
    const data = await response.json();
    
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Error fetching social posts:', error);
    throw error;
  }
};

export const createSocialPost = async (postData: Omit<SocialPost, 'id'>): Promise<SocialPost> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: postData
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error creating social post:', error);
    throw error;
  }
};

export const updateSocialPost = async (id: string, updates: Partial<SocialPost>): Promise<SocialPost> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: updates
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error updating social post:', error);
    throw error;
  }
};

// Brand Guidelines
export const fetchBrandGuidelines = async (): Promise<BrandGuideline[]> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.brandGuidelines}`, {
      headers: getHeaders()
    });
    const data = await response.json();
    
    return data.records.map((record: any) => ({
      recordId: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Error fetching brand guidelines:', error);
    throw error;
  }
};

export const updateBrandGuidelines = async (recordId: string, guidelines: Omit<BrandGuideline, 'recordId'>): Promise<BrandGuideline> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.brandGuidelines}/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: guidelines
      })
    });
    const data = await response.json();
    
    return {
      recordId: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error updating brand guidelines:', error);
    throw error;
  }
};

// Writing Prompts
export const fetchWritingPrompts = async (): Promise<WritingPrompt[]> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.writingPrompts}`, {
      headers: getHeaders()
    });
    const data = await response.json();
    
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Error fetching writing prompts:', error);
    throw error;
  }
};

export const updateWritingPrompt = async (id: string, prompt: Omit<WritingPrompt, 'id'>): Promise<WritingPrompt> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.writingPrompts}/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: prompt
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error updating writing prompt:', error);
    throw error;
  }
};

export const createWritingPrompt = async (prompt: Omit<WritingPrompt, 'id'>): Promise<WritingPrompt> => {
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.writingPrompts}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: prompt
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error creating writing prompt:', error);
    throw error;
  }
};

export const deleteWritingPrompt = async (id: string): Promise<void> => {
  try {
    await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.writingPrompts}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  } catch (error) {
    console.error('Error deleting writing prompt:', error);
    throw error;
  }
};