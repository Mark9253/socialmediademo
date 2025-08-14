export const AIRTABLE_CONFIG = {
  apiKey: 'pat5un4mUVSvsbsT5.559b603ed103ab8acda3038829c39eefc2a02d9f4e55ead0d6bac36171b8c644',
  baseId: 'app5wXeTKO82lfUBd', // Updated with correct base ID from your URL
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