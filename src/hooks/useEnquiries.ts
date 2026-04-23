import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Enquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  submitted_at: string;
}

export type EnquiryStatus = 'New' | 'Reviewed' | 'Contacted' | 'Resolved';

const normalizeStatus = (status: string | null | undefined) =>
  (status || '').trim().toLowerCase();

const normalizeEnquiry = (enquiry: Record<string, unknown>): Enquiry => {
  const submittedAt = enquiry.submitted_at || enquiry.created_at;

  return {
    id: String(enquiry.id || ''),
    full_name: String(enquiry.full_name || enquiry.name || 'Unknown'),
    email: String(enquiry.email || ''),
    phone: enquiry.phone ? String(enquiry.phone) : null,
    subject: enquiry.subject ? String(enquiry.subject) : null,
    message: enquiry.message ? String(enquiry.message) : null,
    status: String(enquiry.status || 'New'),
    submitted_at: typeof submittedAt === 'string' ? submittedAt : new Date().toISOString(),
  };
};

export function useEnquiries() {
  return useQuery({
    queryKey: ['enquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error && error.code === '42703') {
        const fallback = await supabase
          .from('enquiries')
          .select('*')
          .order('created_at', { ascending: false, nullsFirst: false });

        if (fallback.error) throw fallback.error;
        return (fallback.data || []).map((item) => normalizeEnquiry(item as Record<string, unknown>));
      }

      if (error) throw error;

      return (data || []).map((item) => normalizeEnquiry(item as Record<string, unknown>));
    },
  });
}

export function useUpdateEnquiryStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EnquiryStatus }) => {
      const { data, error } = await supabase
        .from('enquiries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry-stats'] });
      toast({ title: 'Success', description: 'Enquiry status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useEnquiryStats() {
  return useQuery({
    queryKey: ['enquiry-stats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('enquiries')
          .select('id, status, submitted_at');

        if (error) {
          console.error('Enquiry stats error:', error);
          throw error;
        }

        if (!data) {
          console.warn('No enquiry data returned');
          return { total: 0, newCount: 0, recent: 0 };
        }

        const safeEnquiries = data.map((item) => normalizeEnquiry(item as Record<string, unknown>));
        const total = safeEnquiries.length;
        const newCount = safeEnquiries.filter((e) => normalizeStatus(e.status) === 'new').length;

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        const day = startOfWeek.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

        const recent = safeEnquiries.filter((e) => {
          const submittedAt = new Date(e.submitted_at);
          return Number.isFinite(submittedAt.getTime()) && submittedAt >= startOfWeek;
        }).length;

        console.log('Enquiry stats calculated:', { total, newCount, recent });
        return { total, newCount, recent };
      } catch (err) {
        console.error('Exception in enquiry stats:', err);
        throw err;
      }
    },
  });
}
