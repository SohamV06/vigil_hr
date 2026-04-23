import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Mail, Phone, Calendar, MessageSquareText } from 'lucide-react';
import { Enquiry, EnquiryStatus, useUpdateEnquiryStatus } from '@/hooks/useEnquiries';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EnquiryDetailProps {
  enquiry: Enquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions: EnquiryStatus[] = ['New', 'Reviewed', 'Contacted', 'Resolved'];

const statusColors: Record<string, string> = {
  New: 'bg-accent text-accent-foreground',
  Reviewed: 'bg-warning/10 text-warning border-warning/20',
  Contacted: 'bg-success/10 text-success border-success/20',
  Resolved: 'bg-primary/10 text-primary border-primary/20',
};

export function EnquiryDetail({ enquiry, open, onOpenChange }: EnquiryDetailProps) {
  const updateStatus = useUpdateEnquiryStatus();
  const [currentStatus, setCurrentStatus] = useState<EnquiryStatus>('New');

  useEffect(() => {
    if (enquiry?.status) {
      setCurrentStatus(enquiry.status as EnquiryStatus);
    }
  }, [enquiry?.id, enquiry?.status]);

  if (!enquiry) return null;

  const handleStatusChange = (status: EnquiryStatus) => {
    setCurrentStatus(status);
    updateStatus.mutate(
      { id: enquiry.id, status },
      {
        onError: () => {
          setCurrentStatus(enquiry.status as EnquiryStatus);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl">{enquiry.full_name}</SheetTitle>
              <SheetDescription>{enquiry.subject || 'General enquiry'}</SheetDescription>
            </div>
            <Badge variant="outline" className={statusColors[currentStatus] || ''}>
              {currentStatus}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${enquiry.email}`} className="text-primary hover:underline">
                  {enquiry.email}
                </a>
              </div>
              {enquiry.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${enquiry.phone}`} className="text-foreground hover:underline">
                    {enquiry.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Submitted {format(new Date(enquiry.submitted_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Message</h4>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {enquiry.message || 'No message provided.'}
            </div>
          </div>

          <Separator />

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

          {enquiry.subject && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground flex items-start gap-2">
              <MessageSquareText className="h-4 w-4 mt-0.5 text-primary" />
              <span>Subject: <span className="text-foreground font-medium">{enquiry.subject}</span></span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
