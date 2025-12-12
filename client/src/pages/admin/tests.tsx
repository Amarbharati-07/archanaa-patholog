import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FlaskConical, Plus, Edit, Clock, IndianRupee, Beaker } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Test, TestParameter } from "@shared/schema";

export default function AdminTests() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    code: "",
    category: "",
    price: "",
    duration: "",
    description: "",
    parameters: [] as TestParameter[],
  });
  const [newParameter, setNewParameter] = useState({
    name: "",
    unit: "",
    normalRange: "",
    paramCode: "",
  });

  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: typeof newTest) => {
      return apiRequest("POST", "/api/admin/tests", {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Created",
        description: "New test has been added successfully.",
      });
      setIsAddDialogOpen(false);
      setNewTest({
        name: "",
        code: "",
        category: "",
        price: "",
        duration: "",
        description: "",
        parameters: [],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create",
        description: error.message || "Unable to create test.",
        variant: "destructive",
      });
    },
  });

  const addParameter = () => {
    if (!newParameter.name || !newParameter.unit) {
      toast({
        title: "Required Fields",
        description: "Please enter parameter name and unit.",
        variant: "destructive",
      });
      return;
    }
    setNewTest({
      ...newTest,
      parameters: [
        ...newTest.parameters,
        { ...newParameter, paramCode: newParameter.paramCode || newParameter.name.substring(0, 3).toUpperCase() },
      ],
    });
    setNewParameter({ name: "", unit: "", normalRange: "", paramCode: "" });
  };

  const removeParameter = (index: number) => {
    setNewTest({
      ...newTest,
      parameters: newTest.parameters.filter((_, i) => i !== index),
    });
  };

  const handleCreateTest = () => {
    if (!newTest.name || !newTest.code || !newTest.category || !newTest.price || !newTest.duration) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (newTest.parameters.length === 0) {
      toast({
        title: "Parameters Required",
        description: "Please add at least one test parameter.",
        variant: "destructive",
      });
      return;
    }
    createTestMutation.mutate(newTest);
  };

  const groupedTests = tests?.reduce((acc, test) => {
    const category = test.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {} as Record<string, Test[]>) || {};

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Tests</h1>
            <p className="text-muted-foreground">Manage test catalog and parameters</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-test">
                <Plus className="h-4 w-4" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Test</DialogTitle>
                <DialogDescription>
                  Create a new test with parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Test Name *</Label>
                    <Input
                      id="name"
                      value={newTest.name}
                      onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                      placeholder="e.g., Complete Blood Count"
                      data-testid="input-test-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Test Code *</Label>
                    <Input
                      id="code"
                      value={newTest.code}
                      onChange={(e) => setNewTest({ ...newTest, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., CBC"
                      data-testid="input-test-code"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newTest.category}
                      onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                      placeholder="e.g., Hematology"
                      data-testid="input-test-category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (INR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newTest.price}
                      onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                      placeholder="e.g., 500"
                      data-testid="input-test-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={newTest.duration}
                      onChange={(e) => setNewTest({ ...newTest, duration: e.target.value })}
                      placeholder="e.g., 24 hours"
                      data-testid="input-test-duration"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    placeholder="Brief description of the test..."
                    rows={2}
                    data-testid="input-test-description"
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-3 block">Test Parameters</Label>
                  {newTest.parameters.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {newTest.parameters.map((param, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <span className="flex-1 text-sm">
                            {param.name} ({param.unit}) - {param.normalRange}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                            data-testid={`button-remove-param-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Name"
                      value={newParameter.name}
                      onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                      data-testid="input-param-name"
                    />
                    <Input
                      placeholder="Unit"
                      value={newParameter.unit}
                      onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                      data-testid="input-param-unit"
                    />
                    <Input
                      placeholder="Normal Range"
                      value={newParameter.normalRange}
                      onChange={(e) => setNewParameter({ ...newParameter, normalRange: e.target.value })}
                      data-testid="input-param-range"
                    />
                    <Button type="button" onClick={addParameter} data-testid="button-add-param">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTest}
                  disabled={createTestMutation.isPending}
                  data-testid="button-save-test"
                >
                  {createTestMutation.isPending ? "Creating..." : "Create Test"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedTests).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedTests).map(([category, categoryTests]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-primary" />
                  {category}
                  <Badge variant="secondary" size="sm">{categoryTests.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTests.map((test) => (
                    <Card key={test.id} data-testid={`card-test-${test.code}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold">{test.name}</h3>
                            <span className="text-sm text-primary font-mono">{test.code}</span>
                          </div>
                          <FlaskConical className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                        {test.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {test.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1 text-primary font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            {Number(test.price).toFixed(0)}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {test.duration}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(test.parameters as TestParameter[])?.length || 0} parameters
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Tests Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add your first test to the catalog
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-test">
                Add Test
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
