import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Search, User, AlertCircle, Check, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient, Test, TestParameter } from "@shared/schema";

interface ParameterInput {
  parameterName: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

function isValueAbnormal(value: string, normalRange: string): boolean {
  if (!value || !normalRange) return false;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const rangeMatch = normalRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    const [, min, max] = rangeMatch;
    return numValue < parseFloat(min) || numValue > parseFloat(max);
  }
  
  const lessThan = normalRange.match(/<\s*(\d+\.?\d*)/);
  if (lessThan) {
    return numValue >= parseFloat(lessThan[1]);
  }
  
  const greaterThan = normalRange.match(/>\s*(\d+\.?\d*)/);
  if (greaterThan) {
    return numValue <= parseFloat(greaterThan[1]);
  }
  
  return false;
}

export default function CreateReport() {
  const searchParams = useSearch();
  const preselectedPatientId = new URLSearchParams(searchParams).get("patient");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [parameterInputs, setParameterInputs] = useState<ParameterInput[]>([]);
  const [technician, setTechnician] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/admin/patients"],
  });

  const { data: tests, isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  useEffect(() => {
    if (preselectedPatientId && patients) {
      const patient = patients.find((p) => p.id === preselectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [preselectedPatientId, patients]);

  useEffect(() => {
    if (selectedTest && selectedTest.parameters) {
      const params = selectedTest.parameters as TestParameter[];
      setParameterInputs(
        params.map((p) => ({
          parameterName: p.name,
          value: "",
          unit: p.unit,
          normalRange: p.normalRange,
          isAbnormal: false,
        }))
      );
    } else {
      setParameterInputs([]);
    }
  }, [selectedTest]);

  const filteredPatients = patients?.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.patientId.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.phone.toLowerCase().includes(query)
    );
  });

  const updateParameterValue = (index: number, value: string) => {
    setParameterInputs((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              value,
              isAbnormal: isValueAbnormal(value, p.normalRange),
            }
          : p
      )
    );
  };

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient || !selectedTest) {
        throw new Error("Please select a patient and test");
      }
      
      const data = {
        patientId: selectedPatient.id,
        testId: selectedTest.id,
        technician,
        referredBy: referredBy || undefined,
        collectedAt: new Date().toISOString(),
        parameterResults: parameterInputs.map((p) => ({
          parameterName: p.parameterName,
          value: p.value,
          unit: p.unit,
          normalRange: p.normalRange,
          isAbnormal: p.isAbnormal,
        })),
        remarks: remarks || undefined,
      };
      
      return apiRequest("POST", "/api/admin/reports/generate", data);
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "The report has been created and notifications sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/reports"] });
      navigate("/admin/reports");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Report",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isFormValid = selectedPatient && selectedTest && technician && parameterInputs.every((p) => p.value);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Create Report</h1>
          <p className="text-muted-foreground">Enter test results and generate patient report</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedPatient ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search patient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-patient"
                      />
                    </div>
                    {patientsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredPatients?.slice(0, 10).map((patient) => (
                          <button
                            key={patient.id}
                            className="w-full p-3 rounded-lg border text-left hover-elevate transition-colors"
                            onClick={() => setSelectedPatient(patient)}
                            data-testid={`button-select-patient-${patient.patientId}`}
                          >
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-mono text-primary">{patient.patientId}</span>
                              <span>|</span>
                              <span>{patient.phone}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{selectedPatient.name}</div>
                        <div className="text-sm text-primary font-mono">{selectedPatient.patientId}</div>
                        <div className="text-sm text-muted-foreground">{selectedPatient.phone}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery("");
                      }}
                      data-testid="button-change-patient"
                    >
                      Change Patient
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Test</CardTitle>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedTest?.id || ""}
                    onValueChange={(v) => {
                      const test = tests?.find((t) => t.id === v);
                      setSelectedTest(test || null);
                    }}
                  >
                    <SelectTrigger data-testid="select-test">
                      <SelectValue placeholder="Choose a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests?.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.name} ({test.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
                <CardDescription>
                  {selectedTest
                    ? `Enter values for ${selectedTest.name}`
                    : "Select a test to enter results"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTest && parameterInputs.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Parameter</th>
                            <th className="text-left py-3 px-2 font-medium w-32">Value</th>
                            <th className="text-left py-3 px-2 font-medium">Unit</th>
                            <th className="text-left py-3 px-2 font-medium">Normal Range</th>
                            <th className="text-center py-3 px-2 font-medium w-16">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parameterInputs.map((param, index) => (
                            <tr key={param.parameterName} className="border-b">
                              <td className="py-3 px-2 font-medium">{param.parameterName}</td>
                              <td className="py-3 px-2">
                                <Input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => updateParameterValue(index, e.target.value)}
                                  className={`w-24 ${param.isAbnormal ? "border-destructive" : ""}`}
                                  data-testid={`input-param-${param.parameterName.toLowerCase().replace(/\s+/g, "-")}`}
                                />
                              </td>
                              <td className="py-3 px-2 text-muted-foreground">{param.unit}</td>
                              <td className="py-3 px-2 text-muted-foreground">{param.normalRange}</td>
                              <td className="py-3 px-2 text-center">
                                {param.value && (
                                  param.isAbnormal ? (
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      High/Low
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-success text-success-foreground">
                                      <Check className="h-3 w-3 mr-1" />
                                      Normal
                                    </Badge>
                                  )
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="technician">Technician Name *</Label>
                        <Input
                          id="technician"
                          value={technician}
                          onChange={(e) => setTechnician(e.target.value)}
                          placeholder="Enter technician name"
                          data-testid="input-technician"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referredBy">Referred By (Doctor Email)</Label>
                        <Input
                          id="referredBy"
                          type="email"
                          value={referredBy}
                          onChange={(e) => setReferredBy(e.target.value)}
                          placeholder="doctor@example.com"
                          data-testid="input-referred-by"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Textarea
                        id="remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Additional notes or observations..."
                        rows={3}
                        data-testid="input-remarks"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        onClick={() => generateReportMutation.mutate()}
                        disabled={!isFormValid || generateReportMutation.isPending}
                        className="gap-2"
                        data-testid="button-generate-report"
                      >
                        {generateReportMutation.isPending ? (
                          "Generating..."
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Generate & Publish Report
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a patient and test to enter results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
