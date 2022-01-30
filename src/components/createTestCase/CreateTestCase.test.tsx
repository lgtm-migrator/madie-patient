import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateTestCase from "./CreateTestCase";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import TestCaseRoutes from "../routes/TestCaseRoutes";
import TestCase from "../../models/TestCase";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const serviceConfig: ServiceConfig = {
  testCaseService: {
    baseUrl: "base.url",
  },
};

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("CreateTestCase component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render create test case page", () => {
    render(
      <MemoryRouter>
        <CreateTestCase />
      </MemoryRouter>
    );
    screen.debug();
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
    render(
      <MemoryRouter>
        <ApiContextProvider value={serviceConfig}>
          <CreateTestCase />
        </ApiContextProvider>
      </MemoryRouter>
    );
    const testCaseDescription = "TestCase123";
    const testCaseTitle = "TestTitle";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        json: `{"test":"test"}`,
        title: testCaseTitle,
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case saved successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  });

  it("should provide user alert when create test case fails", async () => {
    render(
      <MemoryRouter>
        <ApiContextProvider value={serviceConfig}>
          <CreateTestCase />
        </ApiContextProvider>
      </MemoryRouter>
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
    render(
      <MemoryRouter>
        <ApiContextProvider value={serviceConfig}>
          <CreateTestCase />
        </ApiContextProvider>
      </MemoryRouter>
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
    render(
      <MemoryRouter>
        <ApiContextProvider value={serviceConfig}>
          <CreateTestCase />
        </ApiContextProvider>
      </MemoryRouter>
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
    mockedAxios.get.mockResolvedValue({
      data: testCase,
    });

    render(
      <MemoryRouter initialEntries={["/measure/m1234/edit/test-cases/1234"]}>
        <ApiContextProvider value={serviceConfig}>
          <TestCaseRoutes />
        </ApiContextProvider>
      </MemoryRouter>
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
    const testCase = { id: "1234", description: "Test IPP" } as TestCase;
    const testCaseDescription = "modified description";
    mockedAxios.get.mockResolvedValue({
      data: testCase,
    });

    render(
      <MemoryRouter initialEntries={["/measure/m1234/edit/test-cases/1234"]}>
        <ApiContextProvider value={serviceConfig}>
          <TestCaseRoutes />
        </ApiContextProvider>
      </MemoryRouter>
    );

    mockedAxios.put.mockResolvedValue({
      data: { ...testCase, description: testCaseDescription },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Update Test Case" })
      ).toBeInTheDocument();
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);
    userEvent.type(descriptionInput, `{selectall}{del}${testCaseDescription}`);

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
  });

  it("should ignore supplied changes when cancel button is clicked during test case edit", async () => {
    const testCase = { id: "1234", description: "Test IPP" } as TestCase;
    const modifiedDescription = "modified description";
    mockedAxios.get.mockResolvedValue({
      data: testCase,
    });

    render(
      <MemoryRouter initialEntries={["/measure/m1234/edit/test-cases/1234"]}>
        <ApiContextProvider value={serviceConfig}>
          <TestCaseRoutes />
        </ApiContextProvider>
      </MemoryRouter>
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
    render(
      <MemoryRouter>
        <CreateTestCase />
      </MemoryRouter>
    );

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
    render(
      <MemoryRouter>
        <ApiContextProvider value={serviceConfig}>
          <CreateTestCase />
        </ApiContextProvider>
      </MemoryRouter>
    );

    const testCaseDescription =
      "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
    const testCaseTitle = "TestTitle";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        description: testCaseDescription,
        title: testCaseTitle,
      },
    });

    const descriptionInput = screen.getByTestId("create-test-case-description");
    userEvent.type(descriptionInput, testCaseDescription);

    const createBtn = screen.getByRole("button", { name: "Create Test Case" });
    userEvent.click(createBtn);

    const debugOutput = await screen.findByText(
      "Test case saved successfully! Redirecting back to Test Cases..."
    );
    expect(debugOutput).toBeInTheDocument();
  });
});
