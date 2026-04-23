import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { RecentEnquiries } from '@/components/dashboard/RecentEnquiries';
import { useJobs } from '@/hooks/useJobs';
import { useApplicationStats } from '@/hooks/useApplications';
import { useEnquiryStats } from '@/hooks/useEnquiries';
import { Briefcase, Users, Clock, TrendingUp, MessageSquare, MailOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: stats, isLoading: statsLoading } = useApplicationStats();
  const { data: enquiryStats, isLoading: enquiryStatsLoading, error: enquiryError, refetch: refetchEnquiries } = useEnquiryStats();

  const activeJobs = jobs?.length || 0;
  const isLoading = jobsLoading || statsLoading || enquiryStatsLoading;

  useEffect(() => {
    refetchEnquiries();
  }, [refetchEnquiries]);

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome to Hiring Platform">
      <div className="space-y-6 animate-fade-in">
        {enquiryError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg text-sm">
            Error loading enquiry stats: {enquiryError?.message || 'Unknown error'}
          </div>
        )}
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-[140px]">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ))
          ) : (
            <>
              <MetricCard
                title="Active Jobs"
                value={activeJobs}
                description="Open positions"
                icon={Briefcase}
              />
              <MetricCard
                title="Total Applications"
                value={stats?.total || 0}
                description="All time"
                icon={Users}
              />
              <MetricCard
                title="New Applications"
                value={stats?.newCount || 0}
                description="Pending review"
                icon={Clock}
              />
              <MetricCard
                title="This Week"
                value={stats?.recent || 0}
                description="Recent submissions"
                icon={TrendingUp}
              />
              <MetricCard
                title="Total Enquiries"
                value={enquiryStats?.total || 0}
                description="All inbound leads"
                icon={MessageSquare}
              />
              <MetricCard
                title="New Enquiries"
                value={enquiryStats?.newCount || 0}
                description="Awaiting response"
                icon={MailOpen}
              />
            </>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentApplications />
          <RecentEnquiries />

          {/* Quick Stats Card */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/jobs/new"
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                >
                  <Briefcase className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Post New Job</p>
                </a>
                <a
                  href="/applications"
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Review Applications</p>
                </a>
                <a
                  href="/enquiries"
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center sm:col-span-2"
                >
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Review Enquiries</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
