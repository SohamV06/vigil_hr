import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Loader2, MessageSquare, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnquiryDetail } from '@/components/enquiries/EnquiryDetail';
import { useEnquiries, Enquiry } from '@/hooks/useEnquiries';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, string> = {
  New: 'bg-accent text-accent-foreground',
  Reviewed: 'bg-warning/10 text-warning border-warning/20',
  Contacted: 'bg-success/10 text-success border-success/20',
  Resolved: 'bg-primary/10 text-primary border-primary/20',
};

export default function Enquiries() {
  const { data: enquiries, isLoading, error, refetch } = useEnquiries();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const filteredEnquiries = enquiries?.filter((enquiry) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      enquiry.full_name.toLowerCase().includes(searchValue) ||
      enquiry.email.toLowerCase().includes(searchValue) ||
      enquiry.subject?.toLowerCase().includes(searchValue) ||
      enquiry.message?.toLowerCase().includes(searchValue);

    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <DashboardLayout title="Enquiries" subtitle="Review and manage inbound enquiries">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, subject, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
              <AlertCircle className="h-12 w-12 mb-4 opacity-70" />
              <p className="text-lg font-medium">Failed to load enquiries</p>
              <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No enquiries found</p>
              <p className="text-sm">Enquiries will appear here when leads contact you</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {enquiry.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{enquiry.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{enquiry.email}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {enquiry.subject || 'General enquiry'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[enquiry.status] || ''}>
                        {enquiry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(enquiry.submitted_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <EnquiryDetail
        enquiry={selectedEnquiry}
        open={!!selectedEnquiry}
        onOpenChange={(open) => !open && setSelectedEnquiry(null)}
      />
    </DashboardLayout>
  );
}
