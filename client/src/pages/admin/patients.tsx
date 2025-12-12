import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Plus, User, Phone, Mail, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

export default function AdminPatients() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    address: "",
  });

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/admin/patients", searchQuery],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: typeof newPatient) => {
      const res = await apiRequest("POST", "/api/admin/patients", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient Created",
        description: "New patient has been registered successfully.",
      });
      setIsAddDialogOpen(false);
      setNewPatient({ name: "", phone: "", email: "", gender: "", address: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/patients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create",
        description: error.message || "Unable to create patient.",
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients?.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.patientId.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.phone.toLowerCase().includes(query) ||
      (p.email?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleCreatePatient = () => {
    if (!newPatient.name || !newPatient.phone) {
      toast({
        title: "Required Fields",
        description: "Please enter name and phone number.",
        variant: "destructive",
      });
      return;
    }
    createPatientMutation.mutate(newPatient);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Patients</h1>
            <p className="text-muted-foreground">Manage patient records</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-patient">
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Register a new patient in the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="Enter patient name"
                    data-testid="input-patient-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    data-testid="input-patient-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="email@example.com"
                    data-testid="input-patient-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}
                  >
                    <SelectTrigger data-testid="select-patient-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="Enter address"
                    data-testid="input-patient-address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePatient}
                  disabled={createPatientMutation.isPending}
                  data-testid="button-save-patient"
                >
                  {createPatientMutation.isPending ? "Creating..." : "Create Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Patient ID, name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-patients"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPatients && filteredPatients.length > 0 ? (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} data-testid={`card-patient-${patient.patientId}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{patient.name}</span>
                          <span className="text-sm text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                            {patient.patientId}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </div>
                          {patient.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <Link href={`/admin/create-report?patient=${patient.id}`}>
                        <Button variant="outline" size="sm" className="gap-2" data-testid={`button-create-report-${patient.patientId}`}>
                          <FileText className="h-4 w-4" />
                          Create Report
                        </Button>
                      </Link>
                      <Link href={`/admin/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`button-view-${patient.patientId}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {searchQuery ? "No Patients Found" : "No Patients Yet"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add your first patient to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-patient">
                  Add Patient
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
