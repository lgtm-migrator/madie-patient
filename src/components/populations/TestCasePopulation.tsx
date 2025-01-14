import React from "react";
import "styled-components/macro";
import { DisplayPopulationValue, PopulationType } from "@madie/madie-models";
import _ from "lodash";
import ExpectActualInput from "./ExpectActualInput";

export interface TestCasePopulationProps {
  executionRun: boolean;
  population: DisplayPopulationValue;
  populationBasis: string;
  showExpected?: boolean;
  disableExpected?: boolean;
  onChange: (population: DisplayPopulationValue) => void;
  measureObservationsCount: number;
  error: any;
}

const TestCasePopulation = ({
  executionRun,
  population,
  populationBasis,
  disableExpected = false,
  onChange,
  measureObservationsCount,
  error,
}: TestCasePopulationProps) => {
  const populationNameTemplate = (prop) => {
    if (prop === PopulationType.MEASURE_POPULATION_OBSERVATION) {
      return (
        _.startCase(PopulationType.MEASURE_OBSERVATION) +
        (measureObservationsCount > 0 ? " " + measureObservationsCount : "")
      );
    }
    if (
      prop === PopulationType.NUMERATOR_OBSERVATION ||
      prop === PopulationType.DENOMINATOR_OBSERVATION
    ) {
      return (
        _.startCase(population.name) +
        (measureObservationsCount > 0 ? " " + measureObservationsCount : "")
      );
    } else {
      return _.startCase(population.name);
    }
  };

  return (
    <React.Fragment key={`fragment-key-${population.name}`}>
      <tr
        tw="border-b"
        key={population.name}
        data-testid={`test-row-population-id-${population.name}`}
        role="row"
      >
        <td>&nbsp;</td>
        <td role="cell">
          {populationNameTemplate(population.name as PopulationType)}
        </td>
        <td role="cell">
          <ExpectActualInput
            id={`${population.id}-expected-cb`}
            aria-labelledby={`${population.name}-expected`}
            name={population.name}
            expectedValue={population.expected}
            onChange={(expectedValue) =>
              onChange({ ...population, expected: expectedValue })
            }
            populationBasis={populationBasis}
            disabled={disableExpected}
            data-testid={`test-population-${population.name}-expected`}
            displayType="expected"
          />
        </td>
        <td role="cell">
          {executionRun ? (
            <ExpectActualInput
              id={`${population.id}-actual-cb`}
              aria-labelledby={`${population.name}-actual`}
              name={population.name}
              expectedValue={population.actual}
              onChange={() => {}} // do nothing - should not be editable here
              populationBasis={populationBasis}
              disabled={true}
              data-testid={`test-population-${population.name}-actual`}
              displayType="actual"
            />
          ) : (
            <pre data-testid={`test-population-${population.name}-actual`}>
              {" "}
              -
            </pre>
          )}
        </td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      {error?.expected && (
        <tr tw="border-b">
          <td>&nbsp;</td>
          <td colSpan={5}>
            <span
              data-testid={`${population.name}-error-helper-text`}
              role="alert"
              className="qpp-error-message"
              style={{ textTransform: "none" }}
            >
              {error?.expected}
            </span>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default TestCasePopulation;
