import { formatDistanceToNow } from 'date-fns';
import { Mail } from 'lucide-react';
import { useEnquiries } from '@/hooks/useEnquiries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  New: 'bg-accent text-accent-foreground',
  Reviewed: 'bg-warning/10 text-warning border-warning/20',
  Contacted: 'bg-success/10 text-success border-success/20',
  Resolved: 'bg-primary/10 text-primary border-primary/20',
};

export function RecentEnquiries() {
  const { data: enquiries, isLoading } = useEnquiries();

  const recentEnquiries = enquiries?.slice(0, 5) || [];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Enquiries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : recentEnquiries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No enquiries yet</p>
        ) : (
          <div className="space-y-4">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {enquiry.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{enquiry.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {enquiry.subject || enquiry.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={statusColors[enquiry.status] || ''}>
                    {enquiry.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(enquiry.submitted_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && recentEnquiries.length > 0 && (
          <a
            href="/enquiries"
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <Mail className="h-4 w-4 mr-1" />
            View all enquiries
          </a>
        )}
      </CardContent>
    </Card>
  );
}
