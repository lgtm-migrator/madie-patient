import { CalculationService } from "./CalculationService";
import { officeVisitMeasure } from "./__mocks__/OfficeVisitMeasure";
import { officeVisitValueSet } from "./__mocks__/OfficeVisitValueSet";
import { officeVisitMeasureBundle } from "./__mocks__/OfficeVisitMeasureBundle";
import { testCaseOfficeVisit } from "./__mocks__/TestCaseOfficeVisit";
import {
  DetailedPopulationGroupResult,
  ExecutionResult,
} from "fqm-execution/build/types/Calculator";
import { FinalResult, Relevance } from "fqm-execution/build/types/Enums";

describe("CalculationService Tests", () => {
  let calculationService: CalculationService;

  beforeEach(() => {
    calculationService = new CalculationService();
  });

  it("IPP, denominator and numerator Pass test", async () => {
    const calculationResults = await calculationService.calculateTestCases(
      officeVisitMeasure,
      [testCaseOfficeVisit],
      officeVisitMeasureBundle,
      [officeVisitValueSet]
    );
    const expectedPopulationResults =
      calculationResults[0].detailedResults[0].populationResults;
    expect(expectedPopulationResults).toEqual([
      { populationType: "initial-population", result: true },
      { populationType: "denominator", result: true },
      { populationType: "numerator", result: true },
    ]);
  });

  it("should handle null raw results", () => {
    const output = calculationService.processRawResults(null);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should handle undefined raw results", () => {
    const output = calculationService.processRawResults(undefined);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should handle empty raw results", () => {
    const output = calculationService.processRawResults([]);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should handle empty detailed results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(0);
  });

  it("should handle undefined detailed results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: undefined,
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(0);
  });

  it("should handle undefined group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: undefined,
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(0);
  });

  it("should handle empty group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(0);
  });

  it("should handle undefined raw group statement result", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: undefined,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(1);
    expect(output["P111"]["group1"]["ippDef"]).toBe(0);
  });

  it("should handles array raw group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: [{}, {}],
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
              {
                statementName: "denomDef",
                libraryName: "MeasureLib",
                raw: [{}],
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(2);
    expect(output["P111"]["group1"]["ippDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["ippDef"]).toBe(2);
    expect(output["P111"]["group1"]["denomDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["denomDef"]).toBe(1);
  });

  it("should handles boolean raw group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: true,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
              {
                statementName: "denomDef",
                libraryName: "MeasureLib",
                raw: false,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(2);
    expect(output["P111"]["group1"]["ippDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["denomDef"]).toBeFalsy();
  });
});
