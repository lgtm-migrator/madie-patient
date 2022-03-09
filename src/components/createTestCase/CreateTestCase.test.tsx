import * as React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateTestCase from "./CreateTestCase";
import userEvent from "@testing-library/user-event";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import TestCase from "../../models/TestCase";
import { MeasureScoring } from "../../models/MeasureScoring";
import { MeasurePopulation } from "../../models/MeasurePopulation";

//temporary solution (after jest updated to version 27) for error: thrown: "Exceeded timeout of 5000 ms for a test.
jest.setTimeout(60000);

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// mock editor to reduce errors and warnings
const mockEditor = { resize: jest.fn() };
jest.mock("../editor/Editor", () => ({ setEditor }) => {
  const React = require("react");
  React.useEffect(() => {
    if (setEditor) {
      setEditor(mockEditor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div data-testid="test-case-editor">editor contents</div>;
});

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "measure.url",
  },
  testCaseService: {
    baseUrl: "base.url",
  },
};

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

const renderWithRouter = (
  initialEntries = [],
  routePath: string,
  element: React.ReactElement
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ApiContextProvider value={serviceConfig}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("CreateTestCase component", () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({
          data: {
            id: "m1234",
            measureScoring: MeasureScoring.COHORT,
          },
        });
      } else if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      }
      return Promise.resolve({ data: null });
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render create test case page", () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );
    const editor = screen.getByTestId("test-case-editor");
    const titleTextInput = screen.getByTestId("create-test-case-title");
    const descriptionTextArea = screen.getByTestId(
      "create-test-case-description"
    );
    expect(titleTextInput).toBeInTheDocument();
    expect(descriptionTextArea).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Test Case" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    expect(editor).toBeInTheDocument();
  });

  it("should create test case when create button is clicked", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );
    const testCaseDescription = "TestCase123";
    const testCaseTitle = "TestTitle";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        title: testCaseTitle,
        hapiOperationOutcome: {
          code: 200,
        },
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case created successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should provide user alert when create test case fails", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );
    const testCaseDescription = "TestCase123";
    mockedAxios.post.mockRejectedValue({
      data: {
        error: "Random error",
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "An error occurred while creating the test case."
    );
  });

  it("should provide user alert for a success result but response is missing ID attribute", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );
    const testCaseDescription = "TestCase123";
    mockedAxios.post.mockResolvedValue({
      data: `The requested URL was rejected. Please contact soc@hcqis.org.
            
             Your support ID is: 12345678901234567890
            `,
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "An error occurred - create did not return the expected successful result."
    );
  });

  it("should clear error alert when user clicks alert close button", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );
    const testCaseDescription = "TestCase123";
    mockedAxios.post.mockRejectedValue({
      data: {
        error: "Random error",
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "An error occurred while creating the test case."
    );

    const closeAlertBtn = screen.getByRole("button", { name: "Close Alert" });
    userEvent.click(closeAlertBtn);

    const dismissedAlert = await screen.queryByRole("alert");
    expect(dismissedAlert).not.toBeInTheDocument();
  });

  it("should load existing test case data when viewing specific test case", async () => {
    const testCase = {
      id: "1234",
      description: "Test IPP",
      json: `{"test":"test"}`,
    } as TestCase;
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    const descriptionTextArea = screen.getByTestId(
      "create-test-case-description"
    );
    expect(descriptionTextArea).toBeInTheDocument();
    await waitFor(
      () => {
        expect(descriptionTextArea).toHaveTextContent(testCase.description);
      },
      { timeout: 1500 }
    );
    expect(
      screen.getByRole("button", { name: "Update Test Case" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should update test case when update button is clicked", async () => {
    const testCase = {
      id: "1234",
      description: "Test IPP",
      series: "SeriesA",
      json: `{"test":"test"}`,
      groupPopulations: [
        {
          group: "Group One",
          scoring: MeasureScoring.RATIO,
          populationValues: [
            {
              name: MeasurePopulation.INITIAL_POPULATION,
              expected: true,
              actual: false,
            },
            {
              name: MeasurePopulation.MEASURE_POPULATION,
              expected: false,
              actual: false,
            },
            {
              name: MeasurePopulation.MEASURE_POPULATION_EXCLUSION,
              expected: false,
              actual: false,
            },
          ],
        },
      ],
    } as TestCase;
    const testCaseDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({
          data: {
            id: "m1234",
            measureScoring: MeasureScoring.CONTINUOUS_VARIABLE,
          },
        });
      } else if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    const g1PopulationValues = await screen.findByText(
      "Group One Population Values"
    );
    expect(g1PopulationValues).toBeInTheDocument();

    mockedAxios.put.mockResolvedValue({
      data: {
        ...testCase,
        description: testCaseDescription,
        hapiOperationOutcome: {
          code: 200,
        },
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const seriesInput = screen.getByRole("textbox", { name: "Series" });
    expect(seriesInput).toHaveValue("SeriesA");

    const descriptionInput = screen.getByTestId("create-test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);
    userEvent.type(descriptionInput, `{selectall}{del}${testCaseDescription}`);

    userEvent.click(seriesInput);
    const list = await screen.findByRole("listbox");
    expect(list).toBeInTheDocument();
    const listItems = within(list).getAllByRole("option");
    expect(listItems[1]).toHaveTextContent("SeriesB");
    userEvent.click(listItems[1]);

    const ippExpectedCb = await screen.findByTestId(
      "test-population-initialPopulation-expected"
    );
    expect(ippExpectedCb).toBeChecked();
    const mpExpectedCb = await screen.findByTestId(
      "test-population-measurePopulation-expected"
    );
    userEvent.click(mpExpectedCb);
    await waitFor(() => {
      expect(mpExpectedCb).toBeChecked();
    });

    await waitFor(() => {
      expect(descriptionInput).toHaveTextContent(testCaseDescription);
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeEnabled();
    });
    userEvent.click(screen.getByRole("button", { name: "Update Test Case" }));

    const debugOutput = await screen.findByText(
      "Test case updated successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();

    const calls = mockedAxios.put.mock.calls;
    expect(calls).toBeTruthy();
    expect(calls[0]).toBeTruthy();
    const updatedTestCase = calls[0][1] as TestCase;
    expect(updatedTestCase).toBeTruthy();
    expect(updatedTestCase.series).toEqual("SeriesB");
    expect(updatedTestCase.groupPopulations).toEqual([
      {
        group: "Group One",
        scoring: MeasureScoring.RATIO,
        populationValues: [
          {
            name: MeasurePopulation.INITIAL_POPULATION,
            expected: true,
            actual: false,
          },
          {
            name: MeasurePopulation.MEASURE_POPULATION,
            expected: true,
            actual: false,
          },
          {
            name: MeasurePopulation.MEASURE_POPULATION_EXCLUSION,
            expected: false,
            actual: false,
          },
        ],
      },
    ]);
  }, 15000);

  it("should display an error when test case update returns no data", async () => {
    const testCase = {
      id: "1234",
      description: "Test IPP",
      json: `{"test":"test"}`,
    } as TestCase;
    const modifiedDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    mockedAxios.put.mockResolvedValue({
      data: null,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);
    userEvent.type(descriptionInput, `{selectall}{del}${modifiedDescription}`);

    await waitFor(() => {
      expect(descriptionInput).toHaveTextContent(modifiedDescription);
    });
    userEvent.click(screen.getByRole("button", { name: "Update Test Case" }));

    const debugOutput = await screen.findByText(
      "An error occurred - update did not return the expected successful result."
    );
    expect(debugOutput);
  });

  it("should display an error when test case update fails", async () => {
    const testCase = {
      id: "1234",
      description: "Test IPP",
      json: `{"test":"test"}`,
    } as TestCase;
    const modifiedDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    const axiosError: AxiosError = {
      response: {
        status: 404,
        data: {},
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;

    mockedAxios.put.mockClear().mockRejectedValue(axiosError);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);
    userEvent.type(descriptionInput, `{selectall}{del}${modifiedDescription}`);

    await waitFor(() => {
      expect(descriptionInput).toHaveTextContent(modifiedDescription);
    });
    userEvent.click(screen.getByRole("button", { name: "Update Test Case" }));

    const debugOutput = await screen.findByText(
      "An error occurred while updating the test case."
    );
    expect(debugOutput);
  });

  it("should ignore supplied changes when cancel button is clicked during test case edit", async () => {
    const testCase = {
      id: "1234",
      description: "Test IPP",
      json: `{"test":"test"}`,
    } as TestCase;
    const modifiedDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);
    userEvent.type(descriptionInput, `{selectall}{del}${modifiedDescription}`);

    await waitFor(() => {
      expect(descriptionInput).toHaveTextContent(modifiedDescription);
    });
    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockedAxios.put).toBeCalledTimes(0);
  });

  it("should generate field level error for test case description more than 250 characters", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const g1PopulationValues = await screen.findByText(
      "Group One Population Values"
    );
    expect(g1PopulationValues).toBeInTheDocument();

    const testCaseDescription =
      "abcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyz";
    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    fireEvent.blur(descriptionInput);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    await waitFor(() => {
      expect(createBtn).toBeDisabled;
      expect(screen.getByTestId("description-helper-text")).toHaveTextContent(
        "Test Case Description cannot be more than 250 characters."
      );
    });
  });

  it("should allow special characters for test case description", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const testCaseDescription =
      "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
    const testCaseTitle = "TestTitle";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        title: testCaseTitle,
        hapiOperationOutcome: {
          code: 201,
        },
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case created successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should display an error when test case series fail to load", async () => {
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({
          data: {
            id: "m1234",
            measureScoring: MeasureScoring.COHORT,
          },
        });
      } else if (args && args.endsWith("series")) {
        return Promise.reject({
          status: 500,
          data: null,
        });
      }
      return Promise.resolve({ data: null });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const debugOutput = await screen.findByText(
      "Unable to retrieve test case series, please try later."
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should display an error when measure doesn't exist fetching test case series", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 404,
        data: {},
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;

    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({
          data: {
            id: "m1234",
            measureScoring: MeasureScoring.COHORT,
          },
        });
      } else if (args && args.endsWith("series")) {
        return Promise.reject(axiosError);
      }
      return Promise.resolve({ data: null });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const g1PopulationValues = await screen.findByText(
      "Group One Population Values"
    );
    expect(g1PopulationValues).toBeInTheDocument();

    const debugOutput = await screen.findByText(
      "Measure does not exist, unable to load test case series!"
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should generate field level error for test case title more than 250 characters", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const g1PopulationValues = await screen.findByText(
      "Group One Population Values"
    );
    expect(g1PopulationValues).toBeInTheDocument();

    const testCaseTitle =
      "abcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyz";
    const titleInput = screen.getByTestId("create-test-case-title");
    userEvent.type(titleInput, testCaseTitle);
    fireEvent.blur(titleInput);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    await waitFor(() => {
      expect(createBtn).toBeDisabled;
      expect(screen.getByTestId("title-helper-text")).toHaveTextContent(
        "Test Case Title cannot be more than 250 characters."
      );
    });
  });

  it("should allow special characters for test case title", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const testCaseDescription = "Test Description";
    const testCaseTitle =
      "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        title: testCaseTitle,
        hapiOperationOutcome: {
          code: 201,
        },
      },
    });

    const titleInput = screen.getByTestId("create-test-case-title");
    userEvent.type(titleInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case created successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should allow special characters for test case series", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const testCaseDescription = "Test Description";
    const testCaseSeries =
      "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        series: testCaseSeries,
        hapiOperationOutcome: {
          code: 201,
        },
      },
    });

    const seriesInput = screen.getByTestId("create-test-case-series");
    userEvent.type(seriesInput, testCaseSeries);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case created successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  }, 15000);

  it("should display HAPI validation errors after create test case", async () => {
    jest.useFakeTimers("modern");
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const testCaseDescription = "Test Description";
    const testCaseSeries =
      "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        series: testCaseSeries,
        hapiOperationOutcome: {
          code: 400,
          outcomeResponse: {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                diagnostics: "Patient.name is a required field",
              },
              {
                severity: "error",
                diagnostics: "Patient.identifier is a required field",
              },
            ],
          },
        },
      },
    });

    const seriesInput = screen.getByTestId("create-test-case-series");
    userEvent.type(seriesInput, testCaseSeries);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "An error occurred with the Test Case JSON while creating the test case"
    );
    expect(debugOutput).toBeInTheDocument();

    const showValidationErrorsBtn = screen.getByRole("button", {
      name: "Validation Errors",
    });
    expect(showValidationErrorsBtn).toBeInTheDocument();
    userEvent.click(showValidationErrorsBtn);
    jest.advanceTimersByTime(700);

    const validationErrorsList = await screen.findByTestId(
      "json-validation-errors-list"
    );
    expect(validationErrorsList).toBeInTheDocument();
    const patientNameError = await within(validationErrorsList).findByText(
      "Patient.name is a required field"
    );
    expect(patientNameError).toBeInTheDocument();
    const patientIdentifierError = within(validationErrorsList).getByText(
      "Patient.identifier is a required field"
    );
    expect(patientIdentifierError).toBeInTheDocument();
  }, 15000);

  it("should display HAPI validation errors after update test case", async () => {
    jest.useFakeTimers("modern");

    const testCase = {
      id: "1234",
      description: "Test IPP",
      series: "SeriesA",
      json: `{"test":"test"}`,
    } as TestCase;
    const testCaseDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    mockedAxios.put.mockResolvedValue({
      data: {
        ...testCase,
        description: testCaseDescription,
        hapiOperationOutcome: {
          code: 400,
          outcomeResponse: {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                diagnostics: "Patient.name is a required field",
              },
              {
                severity: "error",
                diagnostics: "Patient.identifier is a required field",
              },
            ],
          },
        },
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const seriesInput = screen.getByTestId("create-test-case-description");
    userEvent.type(seriesInput, testCaseDescription);
    const updateBtn = screen.getByRole("button", { name: "Update Test Case" });
    userEvent.click(updateBtn);

    const debugOutput = await screen.findByText(
      "An error occurred with the Test Case JSON while updating the test case"
    );
    expect(debugOutput).toBeInTheDocument();

    const showValidationErrorsBtn = screen.getByRole("button", {
      name: "Validation Errors",
    });
    expect(showValidationErrorsBtn).toBeInTheDocument();
    userEvent.click(showValidationErrorsBtn);
    jest.advanceTimersByTime(700);

    const validationErrorsList = await screen.findByTestId(
      "json-validation-errors-list"
    );
    expect(validationErrorsList).toBeInTheDocument();
    const patientNameError = await within(validationErrorsList).findByText(
      "Patient.name is a required field"
    );
    expect(patientNameError).toBeInTheDocument();
    const patientIdentifierError = within(validationErrorsList).getByText(
      "Patient.identifier is a required field"
    );
    expect(patientIdentifierError).toBeInTheDocument();
  });

  it("should alert for HAPI FHIR errors", async () => {
    jest.useFakeTimers("modern");

    const testCase = {
      id: "1234",
      description: "Test IPP",
      series: "SeriesA",
      json: `{"test":"test"}`,
    } as TestCase;
    const testCaseDescription = "modified description";
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
      }
      return Promise.resolve({ data: testCase });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      <CreateTestCase />
    );

    const data = {
      ...testCase,
      description: testCaseDescription,
      hapiOperationOutcome: {
        code: 500,
        message: "An unknown error occurred with HAPI FHIR",
        outcomeResponse: {
          resourceType: "OperationOutcome",
          text: "Bad things happened",
        },
      },
    };

    mockedAxios.put.mockResolvedValue({
      data,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const seriesInput = screen.getByTestId("create-test-case-description");
    userEvent.type(seriesInput, testCaseDescription);
    const updateBtn = screen.getByRole("button", { name: "Update Test Case" });
    userEvent.click(updateBtn);

    const debugOutput = await screen.findByText(
      "An error occurred with the Test Case JSON while updating the test case"
    );
    expect(debugOutput).toBeInTheDocument();

    const showValidationErrorsBtn = screen.getByRole("button", {
      name: "Validation Errors",
    });
    expect(showValidationErrorsBtn).toBeInTheDocument();
    userEvent.click(showValidationErrorsBtn);
    jest.advanceTimersByTime(700);

    const validationErrorsList = await screen.findByTestId(
      "json-validation-errors-list"
    );
    expect(validationErrorsList).toBeInTheDocument();
    const noErrors = await within(validationErrorsList).findByText(
      data.hapiOperationOutcome.outcomeResponse.text
    );
    expect(noErrors).toBeInTheDocument();

    const closeValidationErrorsBtn = await screen.getByRole("button", {
      name: "Validation Errors",
    });
    expect(closeValidationErrorsBtn).toBeInTheDocument();
    userEvent.click(closeValidationErrorsBtn);
    jest.advanceTimersByTime(700);
    const sideButton = await screen.findByTestId(
      "closed-json-validation-errors-aside"
    );
    expect(sideButton).toBeInTheDocument();
    const errorText = screen.queryByText(
      "data.hapiOperationOutcome.outcomeResponse.text"
    );
    expect(errorText).not.toBeInTheDocument();
    expect(mockEditor.resize).toHaveBeenCalledTimes(2);
  });

  it("should display an error when measure groups and measure info cannot be loaded", async () => {
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
      }
      return Promise.reject({
        data: {
          error: "Error with loading measure data",
        },
      });
    });

    renderWithRouter(
      ["/measures/m1234/edit/test-cases/create"],
      "/measures/:measureId/edit/test-cases/create",
      <CreateTestCase />
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Failed to load measure groups. An error occurred while loading the measure."
    );
  });
});
