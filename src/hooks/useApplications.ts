import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: string;
  submitted_at: string;
  job?: {
    title: string;
    department: string;
    location: string;
    type: string;
  };
}

export type ApplicationStatus = 'New' | 'Reviewed' | 'Contacted' | 'Rejected';

/**
 * Fetch all applications with job data.
 * Because the app uses custom admin auth (anon role), PostgREST can't resolve
 * the FK join. We fetch applications and jobs separately, then merge client-side.
 */
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      // Fetch applications
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (appError) throw appError;

      // Fetch all jobs for the lookup
      const { data: jobs, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, department, location, type');

      if (jobError) throw jobError;

      // Build a lookup map: job id -> job details
      const jobMap = new Map(
        (jobs || []).map((j) => [j.id, { title: j.title, department: j.department, location: j.location, type: j.type }])
      );

      // Merge job data onto each application
      return (applications || []).map((app) => ({
        ...app,
        job: jobMap.get(app.job_id) || undefined,
      })) as Application[];
    },
  });
}

// Fetch a single application by ID with job data
export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: app, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (appError) throw appError;

      // Fetch the related job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, department, location, type')
        .eq('id', app.job_id)
        .single();

      if (jobError && jobError.code !== 'PGRST116') throw jobError;

      return {
        ...app,
        job: job ? { title: job.title, department: job.department, location: job.location, type: job.type } : undefined,
      } as Application;
    },
    enabled: !!id,
  });
}

// Mutation to update an application's status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Success', description: 'Application status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Fetch aggregate stats for the dashboard
export function useApplicationStats() {
  return useQuery({
    queryKey: ['application-stats'],
    queryFn: async () => {
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select('id, status, submitted_at');

      if (error) throw error;

      const total = applications.length;
      const newCount = applications.filter(a => a.status === 'New').length;

      // Recent applications (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recent = applications.filter(
        a => new Date(a.submitted_at) >= weekAgo
      ).length;

      return { total, newCount, recent };
    },
  });
}
