export type Step = "TYPE" | "EDIT";
export const Step: Record<Step, Step> = {
  TYPE: "TYPE",
  EDIT: "EDIT",
};

export interface StepState {
  currentStep: Step;
}
