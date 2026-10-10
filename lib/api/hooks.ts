"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ReviewDecisionInput,
  Role,
  SubmissionPayload,
} from "@/lib/api/types";

/**
 * React Query wrappers around the single API entry point. Screens use these hooks
 * and never call `api` directly, so cache invalidation lives in one place
 * (AGENTS.md A4).
 */

export const qk = {
  jobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  buyer: ["buyer"] as const,
  jobStats: (id: string) => ["job-stats", id] as const,
  tasks: ["tasks"] as const,
  task: (id: string) => ["task", id] as const,
  reviewQueue: ["review-queue"] as const,
  review: (id: string) => ["review", id] as const,
  earnings: ["earnings"] as const,
  receipt: (id: string) => ["receipt", id] as const,
  audit: (jobId: string) => ["audit", jobId] as const,
  chain: (jobId?: string) => ["chain", jobId ?? "all"] as const,
  signerPolicy: ["signer-policy"] as const,
  quorum: ["quorum"] as const,
  roles: ["roles"] as const,
};

/* ------------------------------------------------------------------- queries */

export const useJobs = () => useQuery({ queryKey: qk.jobs, queryFn: () => api.listJobs() });

export const useJob = (id: string) =>
  useQuery({ queryKey: qk.job(id), queryFn: () => api.getJob(id), enabled: Boolean(id) });

export const useBuyerOverview = () =>
  useQuery({ queryKey: qk.buyer, queryFn: () => api.buyerOverview() });

export const useJobStats = (id: string) =>
  useQuery({ queryKey: qk.jobStats(id), queryFn: () => api.jobStats(id), enabled: Boolean(id) });

export const useAvailableTasks = () =>
  useQuery({ queryKey: qk.tasks, queryFn: () => api.availableTasks() });

export const useTask = (id: string) =>
  useQuery({ queryKey: qk.task(id), queryFn: () => api.getTask(id), enabled: Boolean(id) });

export const useReviewQueue = () =>
  useQuery({ queryKey: qk.reviewQueue, queryFn: () => api.reviewQueue() });

export const useReview = (id: string) =>
  useQuery({ queryKey: qk.review(id), queryFn: () => api.getReview(id), enabled: Boolean(id) });

export const useEarnings = () =>
  useQuery({ queryKey: qk.earnings, queryFn: () => api.earnings() });

export const useReceipt = (id: string) =>
  useQuery({ queryKey: qk.receipt(id), queryFn: () => api.receipt(id), enabled: Boolean(id) });

export const useAuditSample = (jobId: string) =>
  useQuery({ queryKey: qk.audit(jobId), queryFn: () => api.auditSample(jobId), enabled: Boolean(jobId) });

export const useChainEvents = (jobId?: string) =>
  useQuery({ queryKey: qk.chain(jobId), queryFn: () => api.chainEvents(jobId) });

export const useSignerPolicy = () =>
  useQuery({ queryKey: qk.signerPolicy, queryFn: () => api.signerPolicy() });

export const useQuorumRequests = () =>
  useQuery({ queryKey: qk.quorum, queryFn: () => api.quorumRequests() });

export const useRoles = () => useQuery({ queryKey: qk.roles, queryFn: () => api.roles() });

/* ---------------------------------------------------------------- mutations */

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createJob>[0]) => api.createJob(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.jobs }),
  });
}

export function usePublishJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishJob(id),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: qk.jobs });
      qc.invalidateQueries({ queryKey: qk.job(job.id) });
    },
  });
}

export function useClaimTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.claimTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmissionPayload }) =>
      api.saveDraft(id, payload),
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmissionPayload }) =>
      api.submitTask(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tasks });
      qc.invalidateQueries({ queryKey: qk.earnings });
    },
  });
}

export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewDecisionInput) => api.decide(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reviewQueue });
      qc.invalidateQueries({ queryKey: qk.earnings });
    },
  });
}

export function useAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.appeal(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.earnings }),
  });
}

export function useClaimReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.claimReward(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.earnings }),
  });
}

export function useExportJob() {
  return useMutation({
    mutationFn: (id: string) => api.jobExport(id),
  });
}

/* ------------------------------------------------------------------- admin */

export function useApproveQuorum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.quorumApprove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quorum }),
  });
}

export function useRejectQuorum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.quorumReject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.quorum }),
  });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => api.setRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.roles }),
  });
}

export function usePauseJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.pauseJob(id),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: qk.jobs });
      qc.invalidateQueries({ queryKey: qk.job(job.id) });
    },
  });
}
