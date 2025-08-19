import { AIRTABLE_BASE_URL, getHeaders, AIRTABLE_CONFIG } from '@/config/airtable';
import { SocialPost, BrandGuideline, WritingPrompt, MarketingVideoFolder } from '@/types';

// Social Posts
export const fetchSocialPosts = async (): Promise<SocialPost[]> => {
  try {
    console.log('Fetching from URL:', `${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}`);
    console.log('Using headers:', getHeaders());
    
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}`, {
      headers: getHeaders()
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    const data = JSON.parse(responseText);
    
    return data.records.map((record: any) => ({
      ID: record.id, // Airtable record ID
      ...record.fields,
      // Ensure socialChannels is properly formatted
      socialChannels: Array.isArray(record.fields.socialChannels) 
        ? record.fields.socialChannels.join(', ') 
        : record.fields.socialChannels
    }));
  } catch (error) {
    console.error('Error fetching social posts:', error);
    throw error;
  }
};

export const createSocialPost = async (postData: Omit<SocialPost, 'ID'>): Promise<SocialPost> => {
  try {
    // Remove computed fields that Airtable doesn't accept
    const { goToArticle, ...fieldsToSend } = postData;
    
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_CONFIG.tables.socialPosts}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fields: fieldsToSend
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
    console.log('Base ID:', AIRTABLE_CONFIG.baseId);
    console.log('Table name:', AIRTABLE_CONFIG.tables.socialPosts);
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

// Marketing Video Folder API
export const fetchMarketingVideoFolders = async (): Promise<MarketingVideoFolder[]> => {
  try {
    const url = `${AIRTABLE_BASE_URL}/tblPO6cEWeKXpo1Rs`; // Direct table ID
    console.log('=== DEBUGGING MARKETING VIDEO FOLDERS ===');
    console.log('Base URL:', AIRTABLE_BASE_URL);
    console.log('Table ID:', AIRTABLE_CONFIG.tableIds.marketingVideoFolder);
    console.log('Full URL:', url);
    console.log('Headers:', getHeaders());
    
    const response = await fetch(url, {
      headers: getHeaders()
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Airtable response:', data);
    console.log('First record fields:', data.records[0]?.fields);
    
    return data.records.map((record: any) => ({
      recordId: record.id,
      'Marketing Shorts Folder': record.fields['Marketing Shorts Folder'] || '',
      name: record.fields.name || record.fields.Name || record.fields['Marketing Shorts Folder'] || 'Unnamed Folder',
      url: record.fields.URL || record.fields.url || record.fields.Link || record.fields.link || record.fields['Marketing Shorts Folder'] || ''
    }));
  } catch (error) {
    console.error('Error fetching marketing video folders:', error);
    throw error;
  }
};