import React from "react";
import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import Measure, { Group } from "../models/Measure";
import useOktaTokens from "../hooks/useOktaTokens";

export class MeasureServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async fetchMeasure(id: string): Promise<Measure> {
    try {
      const response = await axios.get<Measure>(
        `${this.baseUrl}/measures/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Unable to fetch measure ${id}`;
      console.error(message, err);
      throw new Error(message);
    }
  }

  async fetchMeasures(filterByCurrentUser: boolean): Promise<Measure[]> {
    try {
      const response = await axios.get<Measure[]>(`${this.baseUrl}/measures`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params: {
          currentUser: filterByCurrentUser,
        },
      });
      return response.data;
    } catch (err) {
      const message = `Unable to fetch measures`;
      console.error(message);
      console.error(err);
      throw new Error(message);
    }
  }

  async updateMeasure(measure: Measure): Promise<void> {
    return await axios.put(`${this.baseUrl}/measures/${measure.id}`, measure, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async createGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.post<Group>(
        `${this.baseUrl}/measures/${measureId}/groups/`,
        group,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Failed to create the group.`;
      console.error(message, err);
      throw new Error(message);
    }
  }

  async updateGroup(group: Group, measureId: string): Promise<Group> {
    try {
      const response = await axios.put<Group>(
        `${this.baseUrl}/measures/${measureId}/groups/`,
        group,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      const message = `Failed to update the group.`;
      console.error(message, err);
      throw new Error(message);
    }
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}