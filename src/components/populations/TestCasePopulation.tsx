import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { PopulationValue } from "../../models/TestCase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { getPopulationCode } from "../../models/MeasurePopulation";

const TD = tw.td`p-1 text-xs text-gray-600`;
const StyledIcon = styled(FontAwesomeIcon)(() => [tw`text-green-700`]);

const StyledInput = tw.input`
  rounded!
  h-4
  w-4
  text-primary-500
  focus:ring-primary-500
  border-gray-200!
  checked:border-primary-500!
  disabled:border-gray-100!
  disabled:bg-gray-100!
`;

const StyledCheckbox = ({ checked, onChange, ...props }) => {
  return (
    <StyledInput
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(!!e.target.checked)}
      {...props}
    />
  );
};

export interface TestCasePopulationProps {
  population: PopulationValue;
  showExpected?: boolean;
  showActual?: boolean;
  disableExpected?: boolean;
  disableActual?: boolean;
  onChange: (population: PopulationValue) => void;
}

const TestCasePopulation = ({
  population,
  disableExpected = false,
  disableActual = false,
  onChange,
}: TestCasePopulationProps) => {
  return (
    <React.Fragment key={`fragment-key-${population.name}`}>
      <tr
        tw="border-b"
        key={population.name}
        data-testid={`test-row-population-id-${population.name}`}
      >
        <TD>
          <StyledIcon
            icon={faCheckCircle}
            data-testid={`test-population-icon-${population.name}`}
          />
        </TD>
        <TD>{getPopulationCode(population.name)}</TD>
        <TD>
          <StyledCheckbox
            id={`${population.name}-expected-cb`}
            checked={population.expected}
            onChange={(checked) =>
              onChange({ ...population, expected: checked })
            }
            disabled={disableExpected}
            data-testid={`test-population-${population.name}-expected`}
          />
        </TD>
        <TD>
          <StyledCheckbox
            id={`${population.name}-actual-cb`}
            checked={population.actual}
            onChange={(checked) => onChange({ ...population, actual: checked })}
            disabled={disableActual}
            data-testid={`test-population-${population.name}-actual`}
          />
        </TD>
      </tr>
    </React.Fragment>
  );
};

export default TestCasePopulation;
