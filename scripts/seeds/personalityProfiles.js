import 'dotenv/config';
import { connectToMongoDB } from '../../src/services/mongodb.js';

const DISC_PROFILES = [
  {
    key: "D",
    title: "The Trailblazing Leader",
    detail: "You are assertive, results-oriented, and thrive on challenges. You're a natural leader who takes initiative and drives progress. You value achievement, competence, and direct communication.",
    strengths: [
      "Decisive and action-oriented",
      "Confident in taking risks",
      "Results-focused and goal-driven",
      "Direct and straightforward communication",
      "Natural problem-solver"
    ],
    values: [
      "Achievement",
      "Independence",
      "Challenge",
      "Efficiency"
    ],
    recommendedJobs: [
      "CEO",
      "Operations Manager",
      "Business Development Manager",
      "Entrepreneur",
      "Sales Director",
      "Project Manager"
    ],
    companyCulture: "Fast-paced, results-driven environments where innovation and bold decision-making are valued. Companies: Startups, consulting firms, tech companies.",
    professionalCharacteristics: "Thrives in competitive environments, excels at making tough decisions, and prefers autonomy and control over projects.",
    traits: { D: "high", I: "low", S: "low", C: "low" }
  },
  {
    key: "I",
    title: "The Charismatic Communicator",
    detail: "You are naturally persuasive, sociable, and thrive in collaborative settings. You bring energy and enthusiasm to your work, excel at building relationships, and inspire others through your optimism and charm.",
    strengths: [
      "Excellent communication and interpersonal skills",
      "Persuasive and influential",
      "Enthusiastic and motivational",
      "Creative and innovative thinking",
      "Natural team builder"
    ],
    values: [
      "Collaboration",
      "Recognition",
      "Creativity",
      "Relationships"
    ],
    recommendedJobs: [
      "Marketing Specialist",
      "HR Manager",
      "Creative Director",
      "Public Relations Manager",
      "Sales Representative",
      "Event Coordinator",
      "Customer Success Manager"
    ],
    companyCulture: "Dynamic, people-focused environments where creativity and collaboration are encouraged. Companies: Creative agencies, tech startups, marketing firms.",
    professionalCharacteristics: "Excels in roles requiring persuasion and networking, prefers team-based work, and thrives in social environments.",
    traits: { D: "low", I: "high", S: "low", C: "low" }
  },
  {
    key: "S",
    title: "The Reliable Supporter",
    detail: "You appreciate stability, consistency, and are a great team player. You're patient, loyal, and excel at creating harmonious environments. You value deep relationships and provide steady, reliable support to those around you.",
    strengths: [
      "Reliable and consistent",
      "Patient and good listener",
      "Team-oriented and supportive",
      "Calm under pressure",
      "Loyal and trustworthy"
    ],
    values: [
      "Stability",
      "Harmony",
      "Loyalty",
      "Cooperation"
    ],
    recommendedJobs: [
      "Customer Service Manager",
      "HR Specialist",
      "Teacher",
      "Social Worker",
      "Counselor",
      "Administrative Officer",
      "Healthcare Professional"
    ],
    companyCulture: "Stable, supportive environments with strong team dynamics and clear processes. Companies: Non-profits, educational institutions, healthcare organizations.",
    professionalCharacteristics: "Prefers predictable workflows, excels in supportive roles, and values long-term relationships and job security.",
    traits: { D: "low", I: "low", S: "high", C: "low" }
  },
  {
    key: "C",
    title: "The Analytical Strategist",
    detail: "You are detail-oriented, analytical, and value accuracy and efficiency. You excel at systematic problem-solving, prefer quality over speed, and bring precision and expertise to your work.",
    strengths: [
      "Highly analytical and logical",
      "Detail-oriented and thorough",
      "Quality-focused and accurate",
      "Systematic problem-solver",
      "Independent and self-motivated"
    ],
    values: [
      "Accuracy",
      "Quality",
      "Expertise",
      "Logic"
    ],
    recommendedJobs: [
      "Data Analyst",
      "Financial Analyst",
      "Software Engineer",
      "Quality Assurance Specialist",
      "IT Consultant",
      "Research Scientist",
      "Accountant"
    ],
    companyCulture: "Structured, process-driven environments where expertise and precision are valued. Companies: Financial institutions, tech companies, consulting firms.",
    professionalCharacteristics: "Thrives on analysis and data, prefers autonomy and clear standards, excels in technical and detail-oriented roles.",
    traits: { D: "low", I: "low", S: "low", C: "high" }
  },
  {
    key: "DI",
    title: "The Dynamic Innovator",
    detail: "You combine assertiveness with sociability to lead and inspire change. You're charismatic, results-driven, and excel at motivating others while driving innovation.",
    strengths: [
      "Visionary leadership",
      "Excellent communicator and motivator",
      "Innovative and action-oriented",
      "Natural influencer",
      "Energetic and enthusiastic"
    ],
    values: [
      "Innovation",
      "Influence",
      "Achievement",
      "Collaboration"
    ],
    recommendedJobs: [
      "Product Manager",
      "Marketing Director",
      "Business Development Manager",
      "Entrepreneur",
      "Sales Director"
    ],
    companyCulture: "Fast-paced, innovative environments where leadership and collaboration drive success. Companies: Tech startups, innovative R&D departments, creative agencies.",
    professionalCharacteristics: "Combines strategic thinking with people skills, excels in leadership roles requiring both vision and team motivation.",
    traits: { D: "high", I: "high", S: "low", C: "low" }
  },
  {
    key: "DS",
    title: "The Grounded Pioneer",
    detail: "You blend ambition with a methodical approach to steadily drive progress. You're results-focused yet patient, creating sustainable change through consistent effort.",
    strengths: [
      "Balanced approach to change",
      "Persistent and determined",
      "Reliable leadership",
      "Strategic yet practical",
      "Builds strong foundations"
    ],
    values: [
      "Progress",
      "Stability",
      "Achievement",
      "Reliability"
    ],
    recommendedJobs: [
      "Operations Manager",
      "Project Coordinator",
      "Production Manager",
      "Team Lead"
    ],
    companyCulture: "Organizations balancing growth with stability, where sustainable progress is valued. Companies: Manufacturing firms, large corporations.",
    professionalCharacteristics: "Drives results while maintaining team cohesion, excels in roles requiring both leadership and process management.",
    traits: { D: "high", I: "low", S: "high", C: "low" }
  },
  {
    key: "DC",
    title: "The Tactical Executive",
    detail: "You merge leadership with meticulous planning to achieve high standards. You're strategic, detail-oriented, and drive excellence through careful analysis and decisive action.",
    strengths: [
      "Strategic and analytical",
      "High standards for quality",
      "Decisive yet thorough",
      "Excellent planner",
      "Results-focused with attention to detail"
    ],
    values: [
      "Excellence",
      "Precision",
      "Strategy",
      "Achievement"
    ],
    recommendedJobs: [
      "CEO",
      "Financial Director",
      "Operations Manager",
      "Strategic Consultant",
      "Engineering Manager"
    ],
    companyCulture: "High-performance environments valuing both results and quality. Companies: Consulting firms, financial institutions, tech companies.",
    professionalCharacteristics: "Combines big-picture thinking with detail orientation, excels in leadership roles requiring strategic planning and execution.",
    traits: { D: "high", I: "low", S: "low", C: "high" }
  },
  {
    key: "IS",
    title: "The Engaging Motivator",
    detail: "You use charm and empathy to encourage and uplift team morale. You're warm, supportive, and excel at building strong relationships while creating positive team dynamics.",
    strengths: [
      "Excellent relationship builder",
      "Empathetic and supportive",
      "Positive and encouraging",
      "Strong team player",
      "Creates harmonious environments"
    ],
    values: [
      "Relationships",
      "Harmony",
      "Collaboration",
      "Support"
    ],
    recommendedJobs: [
      "HR Manager",
      "Teacher",
      "Counselor",
      "Customer Success Manager",
      "Team Coordinator"
    ],
    companyCulture: "People-focused environments emphasizing teamwork and employee wellbeing. Companies: Non-profits, educational institutions, healthcare organizations.",
    professionalCharacteristics: "Excels in people-oriented roles, creates strong team bonds, thrives in supportive and collaborative settings.",
    traits: { D: "low", I: "high", S: "high", C: "low" }
  },
  {
    key: "IC",
    title: "The Creative Persuader",
    detail: "You leverage communication and precision to craft compelling narratives. You're creative yet detail-oriented, combining innovation with analytical thinking.",
    strengths: [
      "Creative and analytical",
      "Excellent communicator",
      "Detail-oriented storyteller",
      "Strategic thinker",
      "Persuasive and precise"
    ],
    values: [
      "Creativity",
      "Accuracy",
      "Innovation",
      "Excellence"
    ],
    recommendedJobs: [
      "Marketing Strategist",
      "UX Designer",
      "Content Strategist",
      "Brand Manager",
      "Research Analyst"
    ],
    companyCulture: "Innovative environments valuing both creativity and precision. Companies: Creative agencies, tech companies, design firms.",
    professionalCharacteristics: "Combines creative thinking with analytical rigor, excels in roles requiring both innovation and attention to detail.",
    traits: { D: "low", I: "high", S: "low", C: "high" }
  },
  {
    key: "SC",
    title: "The Dependable Facilitator",
    detail: "You balance teamwork with a keen eye for detail to support and refine processes. You're thorough, reliable, and ensure quality through consistent, methodical work.",
    strengths: [
      "Thorough and detail-oriented",
      "Reliable and consistent",
      "Process-focused",
      "Quality-driven",
      "Supportive team member"
    ],
    values: [
      "Quality",
      "Reliability",
      "Process",
      "Teamwork"
    ],
    recommendedJobs: [
      "Quality Assurance Analyst",
      "Administrative Officer",
      "Compliance Specialist",
      "Operations Coordinator",
      "Technical Writer"
    ],
    companyCulture: "Structured organizations valuing quality and process excellence. Companies: Government agencies, law firms, technical companies.",
    professionalCharacteristics: "Excels in roles requiring precision and reliability, ensures quality through systematic approaches and attention to detail.",
    traits: { D: "low", I: "low", S: "high", C: "high" }
  }
];

async function seedProfiles() {
  try {
    console.log('Connecting to MongoDB...');
    const db = await connectToMongoDB();
    
    if (!db) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    console.log('Connected to database');
    const collection = db.collection('personalities');

    // Clear existing profiles
    console.log('Clearing existing personality profiles...');
    await collection.deleteMany({});

    // Insert new DISC profiles
    console.log('Inserting new DISC personality profiles...');
    const result = await collection.insertMany(DISC_PROFILES.map(p => ({
      ...p,
      createdTime: new Date(),
      updatedTime: new Date()
    })));

    console.log(`✓ Successfully inserted ${result.insertedCount} personality profiles`);
    console.log('\nProfiles seeded:');
    DISC_PROFILES.forEach(p => {
      console.log(`  ${p.key}: ${p.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding profiles:', error);
    process.exit(1);
  }
}

seedProfiles();
