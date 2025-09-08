import { createContext } from "react";

export type ProjectInfo = {
    title?: string;
    description?: string;
    slides?: any[];
    projectId?: string;
}

export type ProjectContextType = {
    projectDetailInfo: ProjectInfo | null,
    setProjectDetailInfo: React.Dispatch<React.SetStateAction<ProjectInfo | null>>;
    isGeneratingProject: boolean,
    setIsGeneratingProject: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProjectDetailContext = createContext<ProjectContextType | undefined>(undefined);
