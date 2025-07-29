import { ContentGenerationRequest } from '@/types';

const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/content-generation'; // Update with actual webhook URL

export const triggerContentGeneration = async (sourceData: ContentGenerationRequest): Promise<any> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sourceData)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering content generation:', error);
    
    // Retry logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const retryResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sourceData)
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Retry failed with status: ${retryResponse.status}`);
      }
      
      return await retryResponse.json();
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      throw new Error('Content generation service is temporarily unavailable. Please try again later.');
    }
  }
};