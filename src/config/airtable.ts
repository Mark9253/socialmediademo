export const AIRTABLE_CONFIG = {
  apiKey: 'pat1INllzM738f3Nn.baffa47224643fa0969770ed16feba8862bae24105dde8d3f4eb54358af78b52',
  baseId: 'appYourBaseId', // This needs to be updated with actual base ID
  tables: {
    socialPosts: 'Social Posts',
    brandGuidelines: 'Brand Guidelines', 
    writingPrompts: 'Writing Prompts'
  }
};

export const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}`;

export const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
  'Content-Type': 'application/json'
});