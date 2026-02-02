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
  };
}

export type ApplicationStatus = 'New' | 'Reviewed' | 'Contacted' | 'Rejected';

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(title, department)
        `)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as Application[];
    },
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(title, department)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Application;
    },
    enabled: !!id,
  });
}

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
