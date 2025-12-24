
export interface FozAnalysisResult {
  diagnosis: string;
  foz_proposal?: {
    stabilizer_form: string;
    ffz_algebra_action: string;
    homotopy_path: string;
  };
  groundingSources?: { title: string; uri: string }[];
  falsifiability?: {
    failure_condition: string;
    critical_experiment: string;
    confidence_score: number;
  };
}

export interface Instability {
  id: string;
  canonicalName: string;
  domain: string;
  description: string;
  mathematicalFormulation: string;
  simplifiedMathExplanation?: string;
  fozInterpretation: {
    summary: string;
    lambdaTermExample?: string;
    obstruction?: string;
    strictification?: string;
    homotopyPath?: string;
  };
  experimentComponent?: 'SubsetSum' | 'BlackHole' | 'GradientFlow' | 'RussellsParadox' | 'FFZClock' | 'FFZKernel' | 'TorsionCancellation';
}
