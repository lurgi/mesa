import { proxy } from "valtio";
import { Step, type StepState } from "../domain/step";

export const stepStore = proxy<StepState>({
  currentStep: Step.TYPE,
});
