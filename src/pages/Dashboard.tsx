import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { useJobs } from '@/hooks/useJobs';
import { useApplicationStats } from '@/hooks/useApplications';
import { Briefcase, Users, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: stats, isLoading: statsLoading } = useApplicationStats();

  const activeJobs = jobs?.length || 0;
  const isLoading = jobsLoading || statsLoading;

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome to Vigil Admin">
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
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
            </>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentApplications />
          
          {/* Quick Stats Card */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 shadow-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
