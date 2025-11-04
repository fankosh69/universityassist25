import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MOIExplanation() {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>What is MOI (Medium of Instruction)?</AlertTitle>
      <AlertDescription>
        A Medium of Instruction certificate is an official document from your university 
        confirming that your degree program was taught entirely in English. Many German 
        universities accept this as proof of English proficiency, potentially waiving the 
        need for IELTS or TOEFL scores.
        
        <div className="mt-2">
          <strong>How to get it:</strong> Contact your university's registrar or 
          academic office and request a "Medium of Instruction Certificate" or 
          "Language of Instruction Certificate."
        </div>
      </AlertDescription>
    </Alert>
  );
}
