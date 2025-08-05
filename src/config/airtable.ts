export const AIRTABLE_CONFIG = {
  apiKey: 'patsrvUSbWBAV6VKa.374aad5ae547e3e255b662039d0d6f4e1c6e9f8445779a18ec482447e0d852c6',
  baseId: 'app5wXeTKO82lfUBd', // Updated with your actual base ID
  tableIds: {
    socialPosts: 'tblZwA0JCNPeORaGi', // From your URL
    brandGuidelines: 'tblBrandGuidelines', // You'll need to provide this
    writingPrompts: 'tblWritingPrompts' // You'll need to provide this
  },
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