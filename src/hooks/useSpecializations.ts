import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addSpecializationApi,
  deleteSpecializationApi,
  getAllSpecializationsApi,
  updateSpecializationApi
} from "@/apiCalls/specializations";

export function useSpecializations(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ["specializations", params],
    queryFn: () => getAllSpecializationsApi(params)
  });
}

export function useAddSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSpecializationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
    }
  });
}

export function useUpdateSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: any) =>
      updateSpecializationApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
    }
  });
}

export function useDeleteSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSpecializationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
    }
  });
}