export const AIRTABLE_CONFIG = {
  apiKey: 'pat5un4mUVSvsbsT5.559b603ed103ab8acda3038829c39eefc2a02d9f4e55ead0d6bac36171b8c644',
  baseId: 'app5wXeTKO82lfUBd',
  tableIds: {
    socialPosts: 'tblZwA0JCNPeORaGi',
    brandGuidelines: 'tblBrandGuidelines',
    writingPrompts: 'tblWritingPrompts',
    marketingVideoFolder: 'tblPO6cEWeKXpo1Rs',
    analysis: 'tblm3x5ozV37AQTiW', // Analysis table
    postHistory: 'tbl6mH3DWCqQVO3BL' // Post History table
  },
  tables: {
    socialPosts: 'Social Posts',
    brandGuidelines: 'Brand Guidelines', 
    writingPrompts: 'Writing Prompts',
    marketingVideoFolder: 'Marketing Video Folder',
    analysis: 'Analysis',
    postHistory: 'Post History'
  }
};

export const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}`;

export const getHeaders = () => ({
  'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
  'Content-Type': 'application/json'
});