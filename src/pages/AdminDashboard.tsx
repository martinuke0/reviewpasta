import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/adminAuth';
import { getAllBusinesses, updateBusiness, deleteBusiness, getAdminStats, Business } from '@/lib/d1Db';
import { RefreshCw, LogOut, Pencil, Trash2, TrendingUp, Building2, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { logout, getPassword } = useAdminAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, recentBusinesses: [] });
  const [loading, setLoading] = useState(true);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    place_id: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [businessData, statsData] = await Promise.all([
        getAllBusinesses(),
        getAdminStats(getPassword()!),
      ]);
      setBusinesses(businessData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setEditForm({
      name: business.name,
      place_id: business.place_id,
      location: business.location || '',
      description: business.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBusiness) return;

    try {
      await updateBusiness(editingBusiness.slug, editForm, getPassword()!);
      toast.success('Business updated successfully');
      setEditingBusiness(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update business');
    }
  };

  const handleDelete = async () => {
    if (!deletingSlug) return;

    try {
      await deleteBusiness(deletingSlug, getPassword()!);
      toast.success('Business deleted successfully');
      setDeletingSlug(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete business');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Added This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentBusinesses.length}</div>
              <p className="text-xs text-muted-foreground">Last 5 additions</p>
            </CardContent>
          </Card>
        </div>

        {/* Business Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Place ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell>{business.location || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{business.place_id}</TableCell>
                      <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(business)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSlug(business.slug)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBusiness} onOpenChange={() => setEditingBusiness(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Google Place ID</label>
              <Input
                value={editForm.place_id}
                onChange={(e) => setEditForm({ ...editForm, place_id: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingBusiness(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSlug} onOpenChange={() => setDeletingSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
