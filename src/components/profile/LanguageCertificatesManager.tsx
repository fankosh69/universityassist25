import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Award } from "lucide-react";
import { LanguageCertificate, LanguageProofType } from "@/types/language-requirements";
import { MOIExplanation } from "@/components/MOIExplanation";

interface LanguageCertificatesManagerProps {
  certificates: LanguageCertificate[];
  onChange: (certificates: LanguageCertificate[]) => void;
}

export function LanguageCertificatesManager({ certificates, onChange }: LanguageCertificatesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<LanguageProofType | ''>('');
  const [formData, setFormData] = useState<Partial<LanguageCertificate>>({});

  const resetForm = () => {
    setIsAdding(false);
    setSelectedType('');
    setFormData({});
  };

  const addCertificate = () => {
    if (!selectedType) return;

    const newCert: LanguageCertificate = {
      language: 'English',
      proof_type: selectedType,
      ...formData
    };

    onChange([...certificates, newCert]);
    resetForm();
  };

  const removeCertificate = (index: number) => {
    onChange(certificates.filter((_, i) => i !== index));
  };

  const getProofTypeName = (type: LanguageProofType) => {
    switch (type) {
      case 'moi': return 'MOI Certificate';
      case 'ielts_academic': return 'IELTS Academic';
      case 'toefl_ibt': return 'TOEFL iBT';
      case 'pte_academic': return 'PTE Academic';
      default: return 'Other';
    }
  };

  const getProofTypeIcon = (type: LanguageProofType) => {
    if (type === 'moi') return <FileText className="h-4 w-4" />;
    return <Award className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>English Language Certificates</CardTitle>
        <CardDescription>
          Add your English language proficiency certificates. You can have multiple types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MOIExplanation />

        {/* Display existing certificates */}
        {certificates.length > 0 && (
          <div className="space-y-2">
            {certificates.map((cert, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getProofTypeIcon(cert.proof_type)}
                      <span className="font-medium">{getProofTypeName(cert.proof_type)}</span>
                    </div>
                    
                    {cert.proof_type === 'moi' && cert.moi_details && (
                      <div className="text-sm text-muted-foreground">
                        <p>{cert.moi_details.institution}</p>
                        <p>{cert.moi_details.degree_program}</p>
                        <p>{cert.moi_details.study_period}</p>
                      </div>
                    )}

                    {cert.proof_type === 'ielts_academic' && cert.ielts_details && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Overall: <strong>{cert.ielts_details.overall}</strong></p>
                        {(cert.ielts_details.reading || cert.ielts_details.writing || 
                          cert.ielts_details.listening || cert.ielts_details.speaking) && (
                          <p className="text-xs">
                            R: {cert.ielts_details.reading || '-'} | 
                            W: {cert.ielts_details.writing || '-'} | 
                            L: {cert.ielts_details.listening || '-'} | 
                            S: {cert.ielts_details.speaking || '-'}
                          </p>
                        )}
                        <p>Test Date: {cert.ielts_details.test_date}</p>
                      </div>
                    )}

                    {cert.proof_type === 'toefl_ibt' && cert.toefl_details && (
                      <div className="text-sm text-muted-foreground">
                        <p>Overall: <strong>{cert.toefl_details.overall}</strong></p>
                        <p>Test Date: {cert.toefl_details.test_date}</p>
                      </div>
                    )}

                    {cert.proof_type === 'pte_academic' && cert.pte_details && (
                      <div className="text-sm text-muted-foreground">
                        <p>Overall: <strong>{cert.pte_details.overall}</strong></p>
                        <p>Test Date: {cert.pte_details.test_date}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCertificate(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add new certificate */}
        {!isAdding ? (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Certificate
          </Button>
        ) : (
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proof-type">Proof Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as LanguageProofType)}
              >
                <SelectTrigger id="proof-type">
                  <SelectValue placeholder="Select proof type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moi">MOI (Studies in English)</SelectItem>
                  <SelectItem value="ielts_academic">IELTS Academic</SelectItem>
                  <SelectItem value="toefl_ibt">TOEFL iBT</SelectItem>
                  <SelectItem value="pte_academic">PTE Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MOI Form */}
            {selectedType === 'moi' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="institution">Institution Name</Label>
                  <Input
                    id="institution"
                    placeholder="e.g., University of Cairo"
                    onChange={(e) => setFormData({
                      ...formData,
                      moi_details: { ...formData.moi_details!, institution: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="degree">Degree Program</Label>
                  <Input
                    id="degree"
                    placeholder="e.g., Bachelor of Engineering"
                    onChange={(e) => setFormData({
                      ...formData,
                      moi_details: { ...formData.moi_details!, degree_program: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="period">Study Period</Label>
                  <Input
                    id="period"
                    placeholder="e.g., 2018-2022"
                    onChange={(e) => setFormData({
                      ...formData,
                      moi_details: { ...formData.moi_details!, study_period: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {/* IELTS Form */}
            {selectedType === 'ielts_academic' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ielts-overall">Overall Score (0-9)</Label>
                  <Input
                    id="ielts-overall"
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    onChange={(e) => setFormData({
                      ...formData,
                      ielts_details: { ...formData.ielts_details!, overall: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ielts-reading">Reading</Label>
                    <Input
                      id="ielts-reading"
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      placeholder="Optional"
                      onChange={(e) => setFormData({
                        ...formData,
                        ielts_details: { 
                          ...formData.ielts_details!, 
                          reading: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ielts-writing">Writing</Label>
                    <Input
                      id="ielts-writing"
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      placeholder="Optional"
                      onChange={(e) => setFormData({
                        ...formData,
                        ielts_details: { 
                          ...formData.ielts_details!, 
                          writing: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ielts-listening">Listening</Label>
                    <Input
                      id="ielts-listening"
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      placeholder="Optional"
                      onChange={(e) => setFormData({
                        ...formData,
                        ielts_details: { 
                          ...formData.ielts_details!, 
                          listening: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ielts-speaking">Speaking</Label>
                    <Input
                      id="ielts-speaking"
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      placeholder="Optional"
                      onChange={(e) => setFormData({
                        ...formData,
                        ielts_details: { 
                          ...formData.ielts_details!, 
                          speaking: e.target.value ? parseFloat(e.target.value) : undefined 
                        }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ielts-date">Test Date</Label>
                  <Input
                    id="ielts-date"
                    type="date"
                    onChange={(e) => setFormData({
                      ...formData,
                      ielts_details: { ...formData.ielts_details!, test_date: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {/* TOEFL Form */}
            {selectedType === 'toefl_ibt' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="toefl-overall">Overall Score (0-120)</Label>
                  <Input
                    id="toefl-overall"
                    type="number"
                    min="0"
                    max="120"
                    onChange={(e) => setFormData({
                      ...formData,
                      toefl_details: { ...formData.toefl_details!, overall: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="toefl-date">Test Date</Label>
                  <Input
                    id="toefl-date"
                    type="date"
                    onChange={(e) => setFormData({
                      ...formData,
                      toefl_details: { ...formData.toefl_details!, test_date: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {/* PTE Form */}
            {selectedType === 'pte_academic' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pte-overall">Overall Score (10-90)</Label>
                  <Input
                    id="pte-overall"
                    type="number"
                    min="10"
                    max="90"
                    onChange={(e) => setFormData({
                      ...formData,
                      pte_details: { ...formData.pte_details!, overall: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="pte-date">Test Date</Label>
                  <Input
                    id="pte-date"
                    type="date"
                    onChange={(e) => setFormData({
                      ...formData,
                      pte_details: { ...formData.pte_details!, test_date: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={addCertificate} disabled={!selectedType}>
                Add Certificate
              </Button>
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
