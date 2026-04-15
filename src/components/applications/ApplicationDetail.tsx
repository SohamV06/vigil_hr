import { Application, ApplicationStatus, useUpdateApplicationStatus } from '@/hooks/useApplications';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface ApplicationDetailProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions: ApplicationStatus[] = ['New', 'Reviewed', 'Contacted', 'Rejected'];

const statusColors: Record<string, string> = {
  New: 'bg-accent text-accent-foreground',
  Reviewed: 'bg-warning/10 text-warning border-warning/20',
  Contacted: 'bg-success/10 text-success border-success/20',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function ApplicationDetail({ application, open, onOpenChange }: ApplicationDetailProps) {
  const updateStatus = useUpdateApplicationStatus();
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>('New');

  useEffect(() => {
    if (application?.status) {
      setCurrentStatus(application.status as ApplicationStatus);
    }
  }, [application?.id, application?.status]);

  if (!application) return null;

  const handleStatusChange = (status: ApplicationStatus) => {
    setCurrentStatus(status);
    updateStatus.mutate(
      { id: application.id, status },
      {
        onError: () => {
          setCurrentStatus(application.status as ApplicationStatus);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{application.full_name}</SheetTitle>
              <SheetDescription>
                Applied for {application.job?.title || 'Unknown Position'}
              </SheetDescription>
            </div>
            <Badge variant="outline" className={statusColors[currentStatus] || ''}>
              {currentStatus}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${application.email}`}
                  className="text-primary hover:underline"
                >
                  {application.email}
                </a>
              </div>
              {application.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${application.phone}`}
                    className="text-foreground hover:underline"
                  >
                    {application.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Submitted {format(new Date(application.submitted_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          {application.job && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Job Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Department</span>
                  <p className="font-medium">{application.job.department}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium">{application.job.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{application.job.type}</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Resume */}
          {application.resume_url && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Resume</h4>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </a>
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Cover Letter</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.cover_letter}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Update Status */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Update Status</h4>
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
              disabled={updateStatus.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
