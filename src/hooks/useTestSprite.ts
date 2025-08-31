import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestSpriteTest, CreateTestRequest, TestResult } from '@/lib/testsprite';
import { toast } from 'sonner';

export const useTestSprite = () => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<TestSpriteTest[]>([]);

  const callTestSpriteAPI = useCallback(async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('testsprite-api', {
      body: { action, ...data }
    });

    if (error) {
      throw new Error(error.message);
    }

    return result;
  }, []);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      // Get tests from local database
      const { data: localTests, error: localError } = await supabase
        .from('testsprite_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (localError) {
        throw localError;
      }

      // Transform to match TestSpriteTest interface
      const transformedTests: TestSpriteTest[] = localTests.map(test => ({
        id: test.testsprite_id,
        name: test.name,
        description: test.description,
        url: test.url,
        status: test.status as 'pending' | 'running' | 'passed' | 'failed',
        createdAt: test.created_at,
        lastRun: test.last_run,
        duration: test.duration,
      }));

      setTests(transformedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTest = useCallback(async (testData: CreateTestRequest): Promise<TestSpriteTest> => {
    setLoading(true);
    try {
      const result = await callTestSpriteAPI('create', { testData });
      await fetchTests(); // Refresh list
      toast.success('Test created successfully');
      return result;
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callTestSpriteAPI, fetchTests]);

  const runTest = useCallback(async (testId: string): Promise<TestResult> => {
    setLoading(true);
    try {
      const result = await callTestSpriteAPI('run', { testId });
      await fetchTests(); // Refresh list to update status
      toast.success('Test run initiated');
      return result;
    } catch (error) {
      console.error('Error running test:', error);
      toast.error('Failed to run test');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callTestSpriteAPI, fetchTests]);

  const deleteTest = useCallback(async (testId: string): Promise<void> => {
    setLoading(true);
    try {
      await callTestSpriteAPI('delete', { testId });
      await fetchTests(); // Refresh list
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callTestSpriteAPI, fetchTests]);

  const getTestResults = useCallback(async (testId: string): Promise<TestResult[]> => {
    try {
      const result = await callTestSpriteAPI('results', { testId });
      return result;
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Failed to fetch test results');
      throw error;
    }
  }, [callTestSpriteAPI]);

  return {
    loading,
    tests,
    fetchTests,
    createTest,
    runTest,
    deleteTest,
    getTestResults,
  };
};