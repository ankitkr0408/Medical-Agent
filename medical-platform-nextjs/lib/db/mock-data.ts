// Mock data for frontend preview without database
// Use this when you want to preview the UI without connecting to MongoDB

export const mockUser = {
  id: 'mock-user-1',
  name: 'Dr. John Smith',
  email: 'doctor@example.com',
  role: 'DOCTOR',
  specialization: 'Radiology',
  image: null,
};

export const mockAnalyses = [
  {
    id: 'analysis-1',
    userId: 'mock-user-1',
    filename: 'chest-xray-001.jpg',
    fileUrl: '/placeholder-xray.jpg',
    fileType: 'IMAGE',
    analysis: 'Radiological Analysis:\n\nThe chest X-ray demonstrates clear lung fields bilaterally with no evidence of consolidation, pleural effusion, or pneumothorax. The cardiac silhouette appears within normal limits. The mediastinal contours are unremarkable.\n\nImpression:\n1. Normal chest radiograph\n2. No acute cardiopulmonary abnormality identified\n3. Recommend clinical correlation',
    findings: [
      'Clear lung fields bilaterally',
      'Normal cardiac silhouette',
      'No pleural effusion',
      'No pneumothorax identified',
    ],
    keywords: ['normal', 'chest', 'xray', 'lungs', 'cardiac'],
    severity: 'NORMAL',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'analysis-2',
    userId: 'mock-user-1',
    filename: 'brain-mri-002.nii',
    fileUrl: '/placeholder-mri.jpg',
    fileType: 'NIFTI',
    analysis: 'MRI Brain Analysis:\n\nT1-weighted images show normal gray-white matter differentiation. No evidence of mass lesion, hemorrhage, or acute infarction. Ventricular system is normal in size and configuration.\n\nImpression:\n1. Normal brain MRI\n2. No acute intracranial abnormality\n3. Age-appropriate findings',
    findings: [
      'Normal gray-white matter differentiation',
      'No mass lesion identified',
      'Normal ventricular system',
      'No acute abnormality',
    ],
    keywords: ['brain', 'mri', 'normal', 'neuroimaging'],
    severity: 'NORMAL',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'analysis-3',
    userId: 'mock-user-1',
    filename: 'abdomen-ct-003.dcm',
    fileUrl: '/placeholder-ct.jpg',
    fileType: 'DICOM',
    analysis: 'CT Abdomen Analysis:\n\nThe liver, spleen, pancreas, and kidneys demonstrate normal size and attenuation. No focal lesions identified. The gallbladder is unremarkable. No free fluid or free air.\n\nImpression:\n1. Normal abdominal CT\n2. No acute abdominal pathology\n3. All organs within normal limits',
    findings: [
      'Normal liver appearance',
      'Unremarkable spleen and pancreas',
      'Normal kidneys bilaterally',
      'No free fluid',
    ],
    keywords: ['abdomen', 'ct', 'normal', 'organs'],
    severity: 'NORMAL',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
];

export const mockChatRooms = [
  {
    id: 'room-1',
    userId: 'mock-user-1',
    name: 'Chest X-ray Discussion',
    description: 'Discussion about chest X-ray findings',
    type: 'CASE_DISCUSSION',
    participants: [
      'Dr. Sarah Chen (Cardiologist)',
      'Dr. Michael Rodriguez (Radiologist)',
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    messages: [
      {
        id: 'msg-1',
        chatRoomId: 'room-1',
        userId: 'mock-user-1',
        content: 'What do you think about this chest X-ray?',
        type: 'TEXT',
        createdAt: new Date('2024-01-15T10:00:00'),
      },
      {
        id: 'msg-2',
        chatRoomId: 'room-1',
        userId: 'system',
        content: 'The findings appear normal. No acute abnormalities detected.',
        type: 'AI_RESPONSE',
        createdAt: new Date('2024-01-15T10:01:00'),
      },
    ],
  },
];

export const mockQARooms = [
  {
    id: 'qa-1',
    userId: 'mock-user-1',
    name: 'Q&A Session - January 2024',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockStats = {
  todayAnalyses: 3,
  activeDiscussions: 1,
  totalReports: 3,
  aiAccuracy: '94.2%',
};

// Helper function to simulate async data fetching
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  async getAnalyses(userId: string, limit: number = 10) {
    await delay(500); // Simulate network delay
    return mockAnalyses.slice(0, limit);
  },

  async getChatRooms(userId: string) {
    await delay(300);
    return mockChatRooms;
  },

  async getQARooms(userId: string) {
    await delay(300);
    return mockQARooms;
  },

  async getStats(userId: string) {
    await delay(200);
    return mockStats;
  },
};
