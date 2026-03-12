export type ExportFormat = "md" | "pdf" | "pptx";
export type ExportScope =
  | "current"
  | "with_parent"
  | "with_descendants"
  | "with_recommendations";

export interface ExportPayload {
  format: ExportFormat;
  scope: ExportScope;
  fileName: string;
  sections: string[];
}

export interface ExportState {
  isOpen: boolean;
  isGenerating: boolean;
  lastError: string | null;
  lastPayload: ExportPayload | null;
}
