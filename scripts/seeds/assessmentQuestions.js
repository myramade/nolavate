import 'dotenv/config';
import { connectToMongoDB } from '../../src/services/mongodb.js';

const DISC_QUESTIONS = [
  {
    id: 1,
    order: 1,
    question: "I find myself being the initiator in social situations.",
    trait: "I",
    answers: [
      { id: 1, text: "Definitely not", trait: "I", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "I", score: 2 },
      { id: 3, text: "Neutral", trait: "I", score: 3 },
      { id: 4, text: "Somewhat me", trait: "I", score: 4 },
      { id: 5, text: "Definitely me", trait: "I", score: 5 }
    ]
  },
  {
    id: 2,
    order: 2,
    question: "Organizing and structuring tasks is a natural skill for me.",
    trait: "C",
    answers: [
      { id: 1, text: "Definitely not", trait: "C", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "C", score: 2 },
      { id: 3, text: "Neutral", trait: "C", score: 3 },
      { id: 4, text: "Somewhat me", trait: "C", score: 4 },
      { id: 5, text: "Definitely me", trait: "C", score: 5 }
    ]
  },
  {
    id: 3,
    order: 3,
    question: "I tend to feel stressed when faced with unexpected changes.",
    trait: "S",
    reverse: true,
    answers: [
      { id: 1, text: "Definitely not", trait: "D", score: 5 },
      { id: 2, text: "Somewhat not me", trait: "D", score: 4 },
      { id: 3, text: "Neutral", trait: "S", score: 3 },
      { id: 4, text: "Somewhat me", trait: "S", score: 4 },
      { id: 5, text: "Definitely me", trait: "S", score: 5 }
    ]
  },
  {
    id: 4,
    order: 4,
    question: "Understanding and empathizing with others comes easily to me.",
    trait: "I",
    answers: [
      { id: 1, text: "Definitely not", trait: "I", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "I", score: 2 },
      { id: 3, text: "Neutral", trait: "I", score: 3 },
      { id: 4, text: "Somewhat me", trait: "I", score: 4 },
      { id: 5, text: "Definitely me", trait: "I", score: 5 }
    ]
  },
  {
    id: 5,
    order: 5,
    question: "I am constantly looking for new and innovative ways to do things.",
    trait: "D",
    answers: [
      { id: 1, text: "Definitely not", trait: "D", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "D", score: 2 },
      { id: 3, text: "Neutral", trait: "D", score: 3 },
      { id: 4, text: "Somewhat me", trait: "D", score: 4 },
      { id: 5, text: "Definitely me", trait: "D", score: 5 }
    ]
  },
  {
    id: 6,
    order: 6,
    question: "Self-improvement and personal growth are very important to me.",
    trait: "D",
    answers: [
      { id: 1, text: "Definitely not", trait: "D", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "D", score: 2 },
      { id: 3, text: "Neutral", trait: "D", score: 3 },
      { id: 4, text: "Somewhat me", trait: "D", score: 4 },
      { id: 5, text: "Definitely me", trait: "D", score: 5 }
    ]
  },
  {
    id: 7,
    order: 7,
    question: "I prefer to follow established rules and procedures.",
    trait: "S",
    answers: [
      { id: 1, text: "Definitely not", trait: "S", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "S", score: 2 },
      { id: 3, text: "Neutral", trait: "S", score: 3 },
      { id: 4, text: "Somewhat me", trait: "S", score: 4 },
      { id: 5, text: "Definitely me", trait: "S", score: 5 }
    ]
  },
  {
    id: 8,
    order: 8,
    question: "Exploring philosophical and abstract concepts is intellectually stimulating for me.",
    trait: "I",
    answers: [
      { id: 1, text: "Definitely not", trait: "I", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "I", score: 2 },
      { id: 3, text: "Neutral", trait: "I", score: 3 },
      { id: 4, text: "Somewhat me", trait: "I", score: 4 },
      { id: 5, text: "Definitely me", trait: "I", score: 5 }
    ]
  },
  {
    id: 9,
    order: 9,
    question: "Achieving set goals and targets is a primary motivator for me.",
    trait: "D",
    answers: [
      { id: 1, text: "Definitely not", trait: "D", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "D", score: 2 },
      { id: 3, text: "Neutral", trait: "D", score: 3 },
      { id: 4, text: "Somewhat me", trait: "D", score: 4 },
      { id: 5, text: "Definitely me", trait: "D", score: 5 }
    ]
  },
  {
    id: 10,
    order: 10,
    question: "Maintaining harmony in my relationships is a key priority.",
    trait: "S",
    answers: [
      { id: 1, text: "Definitely not", trait: "S", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "S", score: 2 },
      { id: 3, text: "Neutral", trait: "S", score: 3 },
      { id: 4, text: "Somewhat me", trait: "S", score: 4 },
      { id: 5, text: "Definitely me", trait: "S", score: 5 }
    ]
  },
  {
    id: 11,
    order: 11,
    question: "I have a wide range of interests and hobbies.",
    trait: "I",
    answers: [
      { id: 1, text: "Definitely not", trait: "I", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "I", score: 2 },
      { id: 3, text: "Neutral", trait: "I", score: 3 },
      { id: 4, text: "Somewhat me", trait: "I", score: 4 },
      { id: 5, text: "Definitely me", trait: "I", score: 5 }
    ]
  },
  {
    id: 12,
    order: 12,
    question: "In problem-solving, I rely more on practical solutions than creative ones.",
    trait: "C",
    answers: [
      { id: 1, text: "Definitely not", trait: "C", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "C", score: 2 },
      { id: 3, text: "Neutral", trait: "C", score: 3 },
      { id: 4, text: "Somewhat me", trait: "C", score: 4 },
      { id: 5, text: "Definitely me", trait: "C", score: 5 }
    ]
  },
  {
    id: 13,
    order: 13,
    question: "Receiving feedback or criticism affects me deeply.",
    trait: "S",
    answers: [
      { id: 1, text: "Definitely not", trait: "S", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "S", score: 2 },
      { id: 3, text: "Neutral", trait: "S", score: 3 },
      { id: 4, text: "Somewhat me", trait: "S", score: 4 },
      { id: 5, text: "Definitely me", trait: "S", score: 5 }
    ]
  },
  {
    id: 14,
    order: 14,
    question: "I base most of my decisions on logical analysis rather than intuition.",
    trait: "C",
    answers: [
      { id: 1, text: "Definitely not", trait: "C", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "C", score: 2 },
      { id: 3, text: "Neutral", trait: "C", score: 3 },
      { id: 4, text: "Somewhat me", trait: "C", score: 4 },
      { id: 5, text: "Definitely me", trait: "C", score: 5 }
    ]
  },
  {
    id: 15,
    order: 15,
    question: "Building deep, meaningful relationships is essential in my life.",
    trait: "S",
    answers: [
      { id: 1, text: "Definitely not", trait: "S", score: 1 },
      { id: 2, text: "Somewhat not me", trait: "S", score: 2 },
      { id: 3, text: "Neutral", trait: "S", score: 3 },
      { id: 4, text: "Somewhat me", trait: "S", score: 4 },
      { id: 5, text: "Definitely me", trait: "S", score: 5 }
    ]
  }
];

async function seedQuestions() {
  try {
    console.log('Connecting to MongoDB...');
    const db = await connectToMongoDB();
    
    if (!db) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    console.log('Connected to database');
    const collection = db.collection('assessmentquestions');

    // Clear existing questions
    console.log('Clearing existing assessment questions...');
    await collection.deleteMany({});

    // Insert new DISC questions
    console.log('Inserting new DISC assessment questions...');
    const result = await collection.insertMany(DISC_QUESTIONS.map(q => ({
      ...q,
      createdTime: new Date(),
      updatedTime: new Date()
    })));

    console.log(`✓ Successfully inserted ${result.insertedCount} assessment questions`);
    console.log('\nQuestions seeded:');
    DISC_QUESTIONS.forEach(q => {
      console.log(`  ${q.id}. [${q.trait}] ${q.question}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
