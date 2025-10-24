const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const USE_MOCK_MODE = !PERPLEXITY_API_KEY;

if (USE_MOCK_MODE) {
  console.warn('⚠️  PERPLEXITY_API_KEY not set. Using mock company/personality data.');
  console.warn('   Set PERPLEXITY_API_KEY environment variable for real AI features.');
}

function getMockCompanyDetails(companyName) {
  console.log(`[MOCK] Fetching company details for: ${companyName}`);
  return {
    companyName: companyName,
    website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=2C2C2C&color=fff&size=200`,
    industry: 'Technology',
    about: `${companyName} is a leading company in its industry, committed to innovation and excellence.`,
    location: {
      city: 'San Francisco',
      state: 'CA'
    },
    techStacks: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    dateFounded: '2020',
    numberOfEmployees: '50-200',
    companyCulture: 'Innovative, collaborative, and growth-oriented'
  };
}

function getMockPersonalityTypes() {
  console.log(`[MOCK] Analyzing job description for personality types`);
  return {
    personalities: ['Analytical Thinker', 'Strategic Planner', 'Collaborative Team Player']
  };
}

export async function getCompanyDetails(companyName) {
  if (USE_MOCK_MODE) {
    return getMockCompanyDetails(companyName);
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides company information in JSON format.'
          },
          {
            role: 'user',
            content: `Provide detailed information about the company "${companyName}" in JSON format with these fields: companyName, website, logoUrl, industry, about, location (city, state), techStacks (array), dateFounded (year), numberOfEmployees, companyCulture.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse company details from Perplexity response');
  } catch (error) {
    console.error('Perplexity AI error, falling back to mock:', error.message);
    return getMockCompanyDetails(companyName);
  }
}

export async function getPersonalityTypesFromJobDescription(jobDescription) {
  if (USE_MOCK_MODE) {
    return getMockPersonalityTypes();
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes job descriptions and identifies suitable personality types based on the DISC framework.'
          },
          {
            role: 'user',
            content: `Analyze this job description and suggest 3 DISC personality types that would be a good fit. Return ONLY a JSON object with a "personalities" array of strings. Job description: ${jobDescription}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse personality types from Perplexity response');
  } catch (error) {
    console.error('Perplexity AI error, falling back to mock:', error.message);
    return getMockPersonalityTypes();
  }
}
