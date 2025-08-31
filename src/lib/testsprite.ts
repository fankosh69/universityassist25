export interface TestSpriteConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TestSpriteTest {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  url: string;
  createdAt: string;
  lastRun?: string;
  duration?: number;
  results?: TestResult[];
}

export interface TestResult {
  id: string;
  testId: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  screenshot?: string;
  timestamp: string;
  duration: number;
}

export interface CreateTestRequest {
  name: string;
  description?: string;
  url: string;
  actions?: TestAction[];
}

export interface TestAction {
  type: 'click' | 'fill' | 'navigate' | 'wait' | 'assert';
  selector?: string;
  value?: string;
  timeout?: number;
}

export class TestSpriteClient {
  private config: TestSpriteConfig;

  constructor(config: TestSpriteConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`TestSprite API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getTests(): Promise<TestSpriteTest[]> {
    return this.request<TestSpriteTest[]>('/api/v1/tests');
  }

  async createTest(test: CreateTestRequest): Promise<TestSpriteTest> {
    return this.request<TestSpriteTest>('/api/v1/tests', {
      method: 'POST',
      body: JSON.stringify(test),
    });
  }

  async runTest(testId: string): Promise<TestResult> {
    return this.request<TestResult>(`/api/v1/tests/${testId}/run`, {
      method: 'POST',
    });
  }

  async getTestResults(testId: string): Promise<TestResult[]> {
    return this.request<TestResult[]>(`/api/v1/tests/${testId}/results`);
  }

  async deleteTest(testId: string): Promise<void> {
    await this.request(`/api/v1/tests/${testId}`, {
      method: 'DELETE',
    });
  }
}