import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import TestCase from "../models/TestCase";

export class TestCaseServiceApi {
  constructor(private baseUrl: string) {}

  async createTestCase(testCase: TestCase, measureId: string) {
    try {
      const response = await axios.post<TestCase>(
        `${this.baseUrl}/test-case/${measureId}`,
        testCase
      );
      return response.data;
    } catch (err) {
      const message = `Unable to create new test case`;
      console.error(message, err);
      throw new Error(message);
    }
  }

  async getTestCasesByMeasureId(measureId: string): Promise<TestCase[]> {
    try {
      const response = await axios.get<TestCase[]>(
        `${this.baseUrl}/test-cases/${measureId}`
      );
      return response.data || [];
    } catch (err) {
      const message = "Unable to retrieve test cases, please try later.";
      console.error(message, err);
      throw new Error(message);
    }
  }
}

const useTestCaseServiceApi = (): TestCaseServiceApi => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  return new TestCaseServiceApi(serviceConfig?.testCaseService.baseUrl);
};

export default useTestCaseServiceApi;
