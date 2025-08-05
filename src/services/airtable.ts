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
      ID: record.id, // Airtable record ID
      ...record.fields
    }));
  } catch (error) {
    console.error('Error fetching social posts:', error);
    throw error;
  }
};

export const createSocialPost = async (postData: Omit<SocialPost, 'ID'>): Promise<SocialPost> => {
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
      ID: data.id,
      ...data.fields
    };
  } catch (error) {
    console.error('Error creating social post:', error);
    throw error;
  }
};

export const updateSocialPost = async (id: string, updates: Partial<SocialPost>): Promise<SocialPost> => {
  try {
    console.log('Updating post:', id, 'with updates:', updates);
    const url = `${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}/${id}`;
    console.log('Making PATCH request to:', url);
    
    const requestBody = {
      fields: updates
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    if (!response.ok) {
      console.error('API error response:', data);
      throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    // Verify the update actually took effect
    console.log('Checking if Status field was updated in response...');
    console.log('Expected Status:', updates.Status);
    console.log('Actual Status in response:', data.fields.Status);
    
    if (updates.Status && data.fields.Status !== updates.Status) {
      console.error('WARNING: Status update may have failed!');
      console.error('Sent:', updates.Status, 'but got back:', data.fields.Status);
    }
    
    return {
      ID: data.id,
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
      channel: record.fields.Channel, // Map from Airtable field name
      prompt: record.fields.Prompt // Map from Airtable field name
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
        fields: {
          Channel: prompt.channel, // Map to Airtable field name
          Prompt: prompt.prompt // Map to Airtable field name
        }
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      channel: data.fields.Channel, // Map from Airtable field name
      prompt: data.fields.Prompt // Map from Airtable field name
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
        fields: {
          Channel: prompt.channel, // Map to Airtable field name
          Prompt: prompt.prompt // Map to Airtable field name
        }
      })
    });
    const data = await response.json();
    
    return {
      id: data.id,
      channel: data.fields.Channel, // Map from Airtable field name
      prompt: data.fields.Prompt // Map from Airtable field name
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