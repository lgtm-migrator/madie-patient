import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TestCase } from "@madie/madie-models";
import { TestCaseValidator } from "../../validators/TestCaseValidator";
import {
  MadieDialog,
  TextField,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Box } from "@mui/system";
import { FormHelperText, InputLabel } from "@mui/material";
import { useFormik } from "formik";
import useTestCaseServiceApi from "../../api/useTestCaseServiceApi";
import * as _ from "lodash";
import TextArea from "./TextArea";
import TestCaseSeries from "./TestCaseSeries";
import { sanitizeUserInput } from "../../util/Utils";

interface Toast {
  toastOpen: boolean;
  toastType: string;
  toastMessage: string;
}

interface navigationParams {
  id: string;
  measureId: string;
}

const testCaseSeriesStyles = {
  width: "50%",
  borderRadius: "3px",
  borderWidth: "1px",
  // remove weird line break from legend
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    padding: 0,
    "&&": {
      borderRadius: "3px",
    },
  },
  // input base selector
  "& .MuiInputBase-input": {
    resize: "vertical",
    minHeight: "23px",
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 0.6,
      paddingLeft: "5px",
    },
  },
};

const CreateNewTestCaseDialog = ({ open, onClose }) => {
  const [toast, setToast] = useState<Toast>({
    toastOpen: false,
    toastType: null,
    toastMessage: "",
  });
  const { toastOpen, toastType, toastMessage } = toast;
  const testCaseService = useRef(useTestCaseServiceApi());
  const { id, measureId } = useParams<
    keyof navigationParams
  >() as navigationParams;

  const [seriesState, setSeriesState] = useState<any>({
    loaded: false,
    series: [],
  });

  // style utilities
  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
  };
  const formRow = Object.assign({}, row, spaced);

  const INITIAL_VALUES = {
    title: "",
    description: "",
    series: "",
  } as TestCase;

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES },
    validationSchema: TestCaseValidator,
    onSubmit: async (values: TestCase) => await handleSubmit(values),
  });

  useEffect(() => {
    if (!seriesState.loaded) {
      testCaseService.current
        .getTestCaseSeriesForMeasure(measureId)
        .then((existingSeries) =>
          setSeriesState({ loaded: true, series: existingSeries })
        )
        .catch((error) => {
          console.error(error.message);
          setToast({
            toastOpen: true,
            toastType: "danger",
            toastMessage: error.message,
          });
        });
    }
  }, [id, measureId, testCaseService, seriesState.loaded]);

  const handleSubmit = async (testCase: TestCase) => {
    setToast({
      toastOpen: false,
      toastType: "",
      toastMessage: "",
    });
    testCase.title = sanitizeUserInput(testCase.title);
    testCase.description = sanitizeUserInput(testCase.description);
    testCase.series = sanitizeUserInput(testCase.series);

    await createTestCase(testCase);
  };

  const createTestCase = async (testCase: TestCase) => {
    try {
      const savedTestCase = await testCaseService.current.createTestCase(
        testCase,
        measureId
      );
      handleTestCaseResponse(savedTestCase);
    } catch (error) {
      setToast({
        toastOpen: true,
        toastType: "danger",
        toastMessage:
          "An error occurred while creating the test case: " + error.message,
      });
    }
  };

  async function handleTestCaseResponse(testCase: TestCase) {
    if (testCase && testCase.id) {
      formik.resetForm();
      setToast({
        toastOpen: false,
        toastType: "",
        toastMessage: "",
      });

      const event = new Event("createTestCase");
      window.dispatchEvent(event);

      onClose(true);
    }
  }

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <FormHelperText
          data-testid={`${name}-helper-text`}
          children={formik.errors[name]}
          error={isError}
        />
      );
    }
  }

  return (
    <div data-testid="create-test-case-dialog">
      <MadieDialog
        form
        title="Create Test Case"
        dialogProps={{
          open,
          onClose,
          onSubmit: formik.handleSubmit,
        }}
        cancelButtonProps={{
          variant: "secondary",
          onClick: onClose,
          cancelText: "Cancel",
          "data-testid": "create-test-case-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          "data-testid": "create-test-case-save-button",
          disabled: !(formik.isValid && formik.dirty),
          continueText: "Save",
        }}
      >
        <>
          <Toast
            toastKey="test-case-create-toast"
            toastType={toastType}
            testId={
              toastType === "danger"
                ? "server-error-alerts"
                : "test-case-create-success-text"
            }
            open={toastOpen}
            message={toastMessage}
            onClose={() => {
              setToast({
                toastOpen: false,
                toastType: null,
                toastMessage: "",
              });
            }}
            autoHideDuration={6000}
          />
          <Box sx={formRow}>
            <TextField
              placeholder="Enter Title"
              required
              label="Title"
              id="create-test-case-title"
              inputProps={{
                "data-testid": "create-test-case-title-input",
                "aria-describedby": "create-test-case-title-helper-text",
                required: true,
              }}
              helperText={formikErrorHandler("title", true)}
              data-testid="create-test-case-title"
              size="small"
              error={formik.touched.title && Boolean(formik.errors.title)}
              {...formik.getFieldProps("title")}
            />
          </Box>

          <Box sx={formRow}>
            <TextArea
              label="Description"
              required={false}
              name="create-test-case-description"
              id="create-test-case-description"
              inputProps={{
                "data-testid": "create-test-case-description-input",
              }}
              onChange={formik.handleChange}
              value={formik.values.description}
              placeholder="Enter Description"
              data-testid="create-test-case-description"
              {...formik.getFieldProps("description")}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={formikErrorHandler("description", true)}
            />
          </Box>

          <InputLabel
            style={{
              marginTop: "23px",
              textTransform: "capitalize",
              fontFamily: "Rubik",
              fontSize: "14px",
              fontWeight: 500,
              color: "rgb(51, 51, 51)",
            }}
            htmlFor="test-case-series"
          >
            Test Case Group
          </InputLabel>

          <TestCaseSeries
            value={formik.values.series}
            onChange={(nextValue) => formik.setFieldValue("series", nextValue)}
            seriesOptions={seriesState.series}
            sx={testCaseSeriesStyles}
          />
        </>
      </MadieDialog>
    </div>
  );
};

export default CreateNewTestCaseDialog;
