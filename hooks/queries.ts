"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listServices,
  getServiceWithProvider,
  getProviderPublicProfile,
  getSavedServiceIds,
  toggleSavedService,
  listClientBookings,
  listProviderBookings,
  listNotifications,
  type ServiceQuery,
} from "@/lib/data";

// Centralised query keys so cache invalidation stays consistent.
export const queryKeys = {
  services: (q: ServiceQuery) => ["services", q] as const,
  service: (id: string) => ["service", id] as const,
  provider: (id: string) => ["provider", id] as const,
  savedServices: (studentId: string) => ["saved-services", studentId] as const,
  clientBookings: (clientId: string) => ["client-bookings", clientId] as const,
  providerBookings: (providerId: string) =>
    ["provider-bookings", providerId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
};

export function useServices(query: ServiceQuery = {}) {
  return useQuery({
    queryKey: queryKeys.services(query),
    queryFn: () => listServices(query),
  });
}

export function useService(id: string, requireApproved = false) {
  return useQuery({
    queryKey: queryKeys.service(id),
    queryFn: () => getServiceWithProvider(id, { requireApproved }),
    enabled: !!id,
  });
}

export function useProviderProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.provider(userId),
    queryFn: () => getProviderPublicProfile(userId),
    enabled: !!userId,
  });
}

export function useSavedServiceIds(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.savedServices(studentId ?? ""),
    queryFn: () => getSavedServiceIds(studentId as string),
    enabled: !!studentId,
  });
}

export function useToggleSaved(studentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      currentlySaved,
    }: {
      serviceId: string;
      currentlySaved: boolean;
    }) => toggleSavedService(studentId as string, serviceId, currentlySaved),
    onSuccess: () => {
      if (studentId) {
        qc.invalidateQueries({
          queryKey: queryKeys.savedServices(studentId),
        });
      }
    },
  });
}

export function useClientBookings(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clientBookings(clientId ?? ""),
    queryFn: () => listClientBookings(clientId as string),
    enabled: !!clientId,
  });
}

export function useProviderBookings(providerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.providerBookings(providerId ?? ""),
    queryFn: () => listProviderBookings(providerId as string),
    enabled: !!providerId,
  });
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    queryFn: () => listNotifications(userId as string),
    enabled: !!userId,
  });
}
