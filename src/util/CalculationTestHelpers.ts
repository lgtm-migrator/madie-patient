import { Measure, Population } from "@madie/madie-models";
import { FHIRHelpers } from "./FHIRHelpers";
import { getFhirMeasurePopulationCode } from "./PopulationsMap";
import _ from "lodash";

export function buildMeasureBundle(measure: Measure): fhir4.Bundle {
  const bundle: fhir4.Bundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      // Measure Resource
      {
        resource: {
          resourceType: "Measure",
          status: "draft", //TODO convert measure.state to status enum.
          library: [
            `http://ecqi.healthit.gov/ecqms/Library/${measure.cqlLibraryName}`,
          ],
          group: [],
        },
        request: { method: "PUT", url: `Measure/${measure.cqlLibraryName}` },
      },
      // Measure Library Resource
      {
        resource: {
          resourceType: "Library",
          url: `http://ecqi.healthit.gov/ecqms/Library/${measure.cqlLibraryName}`,
          status: "active",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/library-type",
                code: "logic-library",
              },
            ],
          },
          content: [
            { contentType: "text/cql", data: `${btoa(measure.cql)}` },
            {
              contentType: "application/elm+json",
              data: `${btoa(measure.elmJson)}`,
            },
          ],
        },
        request: { method: "PUT", url: `Library/${measure.cqlLibraryName}` },
      },
      // FHIR Helpers
      { ...FHIRHelpers },
    ],
  };
  const measureResource: fhir4.Measure = bundle.entry.find(
    (e) => e.resource.resourceType === "Measure"
  ).resource as fhir4.Measure;

  buildMeasureGroups(measure, measureResource);

  return bundle;
}

function buildMeasureGroups(measure: Measure, measureResource: fhir4.Measure) {
  // verify if measureGroup is created? if not Calculation will fail, so return to user specifying to add atleast one measureGroup
  measure.groups?.map((group) => {
    const fhirMeasureGroup: fhir4.MeasureGroup = {};
    fhirMeasureGroup.population = buildMeasureGroup(group.populations);
    measureResource.group.push(fhirMeasureGroup);
  });
}

function buildMeasureGroup(
  measurePopulations: Population[]
): fhir4.MeasureGroupPopulation[] {
  return measurePopulations.map((population) => {
    return buildGroupPopulation(population);
  });
}

function buildGroupPopulation(
  population: Population
): fhir4.MeasureGroupPopulation {
  return {
    code: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/measure-population",
          code: getFhirMeasurePopulationCode(population.name),
          display: _.startCase(population.name),
        },
      ],
    },
    criteria: {
      language: "text/cql.identifier",
      expression: population.definition,
    },
  };
}

export function getExampleValueSet(): fhir4.ValueSet {
  return {
    status: "draft",
    resourceType: "ValueSet",
    id: "vs-1",
    url: "http://vsac.com/vs-1",
    compose: {
      include: [
        {
          system: "http://loinc.com",
          version: "1",
          concept: [
            {
              code: "code-1",
              display: "Code 1",
            },
            {
              code: "code-2",
              display: "Code 2",
            },
          ],
        },
      ],
    },
  };
}
