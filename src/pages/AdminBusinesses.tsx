import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBusinesses, deleteBusiness, Business } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

export default function AdminBusinesses() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const data = await getAllBusinesses();
        setBusinesses(data);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchBusinesses();
    }
  }, [isAdmin, authLoading, navigate]);

  const handleDeleteClick = (business: Business) => {
    setBusinessToDelete(business);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete?.id) return;

    try {
      await deleteBusiness(businessToDelete.id);
      setBusinesses(businesses.filter(b => b.id !== businessToDelete.id));
      toast.success(`${businessToDelete.name} deleted successfully`);
      setDeleteDialogOpen(false);
      setBusinessToDelete(null);
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error('Failed to delete business');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Manage Businesses</h1>
        </div>
        <Button asChild>
          <Link to="/admin/waitlist">Waitlist Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Businesses ({businesses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No businesses yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/review/${business.slug}`}
                        className="hover:underline"
                      >
                        {business.name}
                      </Link>
                    </TableCell>
                    <TableCell>{business.location || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(business.created_at!).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/review/${business.slug}`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(business)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{businessToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
