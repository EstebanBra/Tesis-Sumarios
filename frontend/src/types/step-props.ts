import type { FormularioDenuncia, Involucrado, Testigo } from './denuncia.types';
import type { FileMetadata } from '@/components/FileUploader';

export interface StepProps {
  formulario: FormularioDenuncia;
  handleChange: <K extends keyof FormularioDenuncia>(key: K, value: FormularioDenuncia[K]) => void;
  errors: Record<string, string>;
  intentoAvanzar: boolean;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export interface Paso1Props extends StepProps {
  tipoSeleccionado: { id: number; nombre: string } | null;
  handleBackToSubtipo: () => void;
  allRegions: Array<{ id: string; name: string }>;
  communesDenunciante: Array<{ id: string; name: string }>;
}

export interface Paso2Props extends StepProps {
  handleEsVictimaChange: (esVictima: 'si' | 'no') => void;
  involucrados: Involucrado[];
  handleAddInvolucrado: () => void;
  handleRemoveInvolucrado: (index: number) => void;
  mostrarCamposAdicionalesDenunciado: boolean;
  setMostrarCamposAdicionalesDenunciado: (value: boolean) => void;
  testigos: Testigo[];
  nuevoTestigo: Testigo;
  setNuevoTestigo: React.Dispatch<React.SetStateAction<Testigo>>;
  mostrarFormTestigo: boolean;
  setMostrarFormTestigo: (value: boolean) => void;
  handleAgregarTestigo: () => void;
  handleEliminarTestigo: (index: number) => void;
  archivosEvidencia: FileMetadata[];
  setArchivosEvidencia: React.Dispatch<React.SetStateAction<FileMetadata[]>>;
  enviando: boolean;
  allRegions: Array<{ id: string; name: string; provinces?: any }>;
  lugaresDisponibles: string[];
  setForm: React.Dispatch<React.SetStateAction<FormularioDenuncia>>;
  errorDenunciado: string;
  errorTestigo: string;
  setErrorDenunciado: React.Dispatch<React.SetStateAction<string>>;
  setErrorTestigo: React.Dispatch<React.SetStateAction<string>>;
}

export interface Paso3Props {
  formulario: FormularioDenuncia;
  tipoSeleccionado: { id: number; nombre: string } | null;
  involucrados: Involucrado[];
  testigos: Testigo[];
  archivosEvidencia: FileMetadata[];
  enviando: boolean;
  onBack: () => void;
  onSubmit: () => void;
}
