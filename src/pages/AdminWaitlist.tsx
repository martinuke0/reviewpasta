import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthButton } from "@/components/AuthButton";
import { toast } from "sonner";
import { ArrowLeft, Link as LinkIcon, CheckCircle, XCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WaitlistEntry {
  id: string;
  email: string;
  phone_number: string;
  name: string;
  business_name: string;
  business_description: string;
  business_url: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminWaitlist = () => {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWaitlist();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, statusFilter, searchQuery]);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.email.toLowerCase().includes(query) ||
        entry.name.toLowerCase().includes(query) ||
        entry.business_name.toLowerCase().includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  const generateMagicLink = async (email: string, entryId: string) => {
    try {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      if (data?.properties?.action_link) {
        await navigator.clipboard.writeText(data.properties.action_link);
        toast.success(t.magicLinkCopied);

        // Update status to approved
        await updateStatus(entryId, 'approved');
      }
    } catch (error) {
      console.error('Error generating magic link:', error);
      toast.error('Failed to generate magic link. Make sure you have admin permissions.');
    }
  };

  const updateStatus = async (entryId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status })
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setEntries(prev =>
        prev.map(entry =>
          entry.id === entryId ? { ...entry, status } : entry
        )
      );

      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'default',
      approved: 'secondary',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading waitlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <LanguageSwitcher />
      <AuthButton />
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </Link>
            <CardTitle>{t.adminWaitlist}</CardTitle>
            <CardDescription>Manage business access requests</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or business..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell className="text-sm">{entry.phone_number}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.business_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {entry.business_description}
                            </p>
                            <a
                              href={entry.business_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                            >
                              Visit <LinkIcon className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {entry.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => generateMagicLink(entry.email, entry.id)}
                                  className="gap-1"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Send Link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(entry.id, 'rejected')}
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {entry.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateMagicLink(entry.email, entry.id)}
                                className="gap-1"
                              >
                                <LinkIcon className="h-3 w-3" />
                                Resend Link
                              </Button>
                            )}
                            {entry.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(entry.id, 'pending')}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Unreject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Stats */}
            <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
              <span>Total: {entries.length}</span>
              <span>Pending: {entries.filter(e => e.status === 'pending').length}</span>
              <span>Approved: {entries.filter(e => e.status === 'approved').length}</span>
              <span>Rejected: {entries.filter(e => e.status === 'rejected').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWaitlist;
