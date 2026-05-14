import { get } from "@/apis/apiClient";

import { ENDPOINT } from "@/apis/endpoint";

import { createApiRequestError } from "@/lib/api-errors";

export const getJobRequestsApi =
  async () => {
    try {
      const res = await get(
        ENDPOINT.GET_JOB_APPLICATIONS,
        {
          needAuth: true,
        },
      );

      return (
        res?.data?.applications ||
        []
      );
    } catch (error) {
      throw createApiRequestError(
        error,
        "Failed to fetch applications",
      );
    }
  };