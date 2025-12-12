import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2, Check, X, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Advertisement } from "@shared/schema";

const gradientOptions = [
  { value: "from-blue-600 to-cyan-500", label: "Blue to Cyan" },
  { value: "from-emerald-600 to-teal-500", label: "Emerald to Teal" },
  { value: "from-purple-600 to-pink-500", label: "Purple to Pink" },
  { value: "from-orange-500 to-red-500", label: "Orange to Red" },
  { value: "from-indigo-600 to-purple-500", label: "Indigo to Purple" },
  { value: "from-green-600 to-emerald-500", label: "Green to Emerald" },
  { value: "from-rose-500 to-pink-500", label: "Rose to Pink" },
  { value: "from-amber-500 to-orange-500", label: "Amber to Orange" },
];

const iconOptions = [
  { value: "FlaskConical", label: "Lab Flask" },
  { value: "BadgePercent", label: "Discount Badge" },
  { value: "Users", label: "Users" },
  { value: "Truck", label: "Truck" },
  { value: "Shield", label: "Shield" },
  { value: "Clock", label: "Clock" },
  { value: "Award", label: "Award" },
];

export default function AdminAdvertisements() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    gradient: "from-blue-600 to-cyan-500",
    icon: "FlaskConical",
    ctaText: "Learn More",
    ctaLink: "/tests",
    isActive: true,
    sortOrder: 0,
  });

  const { data: advertisements, isLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/admin/advertisements", data);
    },
    onSuccess: () => {
      toast({ title: "Advertisement Created", description: "New advertisement has been added." });
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create advertisement.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/admin/advertisements/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Advertisement Updated", description: "Changes have been saved." });
      setEditingAd(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update advertisement.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/advertisements/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Advertisement Deleted", description: "Advertisement has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete advertisement.", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/advertisements/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      gradient: "from-blue-600 to-cyan-500",
      icon: "FlaskConical",
      ctaText: "Learn More",
      ctaLink: "/tests",
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      subtitle: ad.subtitle,
      description: ad.description,
      gradient: ad.gradient,
      icon: ad.icon,
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink,
      isActive: ad.isActive,
      sortOrder: ad.sortOrder,
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.subtitle || !formData.description) {
      toast({ title: "Required Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Advertisements
            </h1>
            <p className="text-muted-foreground">Manage promotional banners displayed on the homepage</p>
          </div>
          <Dialog open={isAddDialogOpen || !!editingAd} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingAd(null);
              resetForm();
            } else {
              setIsAddDialogOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-ad">
                <Plus className="h-4 w-4" />
                Add Advertisement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAd ? "Edit Advertisement" : "Add New Advertisement"}</DialogTitle>
                <DialogDescription>
                  Create promotional banners that will appear in the carousel on the homepage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Special Offers This Month"
                      data-testid="input-ad-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g., Up to 30% OFF"
                      data-testid="input-ad-subtitle"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the offer..."
                    rows={3}
                    data-testid="textarea-ad-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gradient Color</Label>
                    <Select value={formData.gradient} onValueChange={(value) => setFormData({ ...formData, gradient: value })}>
                      <SelectTrigger data-testid="select-ad-gradient">
                        <SelectValue placeholder="Select gradient" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradientOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded bg-gradient-to-r ${opt.value}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger data-testid="select-ad-icon">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText">Button Text</Label>
                    <Input
                      id="ctaText"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="e.g., Learn More"
                      data-testid="input-ad-cta-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaLink">Button Link</Label>
                    <Input
                      id="ctaLink"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="e.g., /tests or /book"
                      data-testid="input-ad-cta-link"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      data-testid="input-ad-sort-order"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-ad-active"
                    />
                    <Label htmlFor="isActive">Active (Show on homepage)</Label>
                  </div>
                </div>
                <div className="pt-4">
                  <Label>Preview</Label>
                  <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${formData.gradient} p-6 mt-2`}>
                    <div className="relative z-10">
                      <p className="text-white/80 text-sm font-medium mb-1">{formData.subtitle || "Subtitle"}</p>
                      <h3 className="text-white text-xl font-bold mb-2">{formData.title || "Title"}</h3>
                      <p className="text-white/90 text-sm">{formData.description || "Description..."}</p>
                      <Button variant="secondary" size="sm" className="mt-3">{formData.ctaText || "Button"}</Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setEditingAd(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-ad">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingAd ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : advertisements && advertisements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advertisements.map((ad) => (
              <Card key={ad.id} className={!ad.isActive ? "opacity-60" : ""} data-testid={`card-ad-${ad.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{ad.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={ad.isActive}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: ad.id, isActive: checked })}
                        data-testid={`switch-ad-toggle-${ad.id}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${ad.gradient} p-4`}>
                    <p className="text-white/80 text-xs">{ad.subtitle}</p>
                    <p className="text-white text-sm font-medium">{ad.title}</p>
                    <p className="text-white/80 text-xs mt-1 line-clamp-2">{ad.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="text-sm text-muted-foreground">
                      Link: {ad.ctaLink} | Order: {ad.sortOrder}
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(ad)} data-testid={`button-edit-ad-${ad.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(ad.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-ad-${ad.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Advertisements</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first advertisement to display promotional banners on the homepage.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Advertisement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
