import {
  Copy,
  Download,
  FileSpreadsheet,
  Instagram,
  Loader,
  Music,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
  Youtube,
} from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useContentGeneration } from "../hooks/useContentGeneration";
import type { GeneratedContent, GenerationRequest } from "../types";
import { useToasts } from "./useToasts";

// Campos que podem receber refinamento e histórico
type FieldKey =
  | "TITULO_PRINCIPAL"
  | "DESCRICAO_LEGENDA"
  | "HASHTAGS_TAGS"
  | "ROTEIRO"
  | "TAGS_YOUTUBE"
  | "PALAVRAS_CHAVE_SEO"
  | "TEXTO_THUMBNAIL"
  | "CTA_VARIANTES";

type FieldValue = string | string[] | undefined;

interface FieldHistoryEntry {
  value: FieldValue;
  timestamp: number;
}

export function ContentGenerator() {
  const { user } = useAuth();
  const {
    generateContent,
    loading: generationLoading,
    error: generationError,
  } = useContentGeneration();
  const [formData, setFormData] = useState({
    plataforma: "YouTube" as "YouTube" | "TikTok" | "Instagram Reels",
    tema: "",
    palavrasChave: "",
    tom: "informativo-entusiasmado",
    duracao: "5-minutos",
    imagem: null as File | null,
    imagemPreview: "" as string,
    lingua: "pt-BR" as string,
  });
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [originalContent, setOriginalContent] =
    useState<GeneratedContent | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<FieldKey>>(
    new Set()
  );
  const [refiningField, setRefiningField] = useState<FieldKey | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const { push } = useToasts();
  const [lastResponseMeta, setLastResponseMeta] = useState<{
    _fallback?: boolean;
    _modelsTried?: string[];
  }>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFields, setExportFields] = useState<Record<string, boolean>>({
    TITULO_PRINCIPAL: true,
    TITULOS_ALTERNATIVOS: true,
    DESCRICAO_LEGENDA: true,
    HASHTAGS_TAGS: true,
    ROTEIRO: true,
    PONTOS_CHAVE_DO_VIDEO: true,
    TAGS_YOUTUBE: true,
    PALAVRAS_CHAVE_SEO: true,
    TEXTO_THUMBNAIL: true,
    CTA_VARIANTES: true,
  });
  const [batchRefineOpen, setBatchRefineOpen] = useState(false);
  const [batchInstruction, setBatchInstruction] = useState("");

  // Histórico de versões/refinadas por campo
  const [fieldHistory, setFieldHistory] = useState<
    Partial<Record<FieldKey, FieldHistoryEntry[]>>
  >({});

  const safeHistory = (field: FieldKey) => fieldHistory[field] || [];
  const normalizeHistoryValue = (v: FieldValue): string => {
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "string") return v;
    return "";
  };

  const [openHistory, setOpenHistory] = useState<
    Partial<Record<FieldKey, boolean>>
  >({});

  const dialogStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#fff",
    padding: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    width: 360,
    zIndex: 50,
    fontSize: 14,
  };

  // Salva versão anterior ao sobrescrever campo
  const saveFieldHistory = (field: FieldKey, value: FieldValue) => {
    if (value === undefined || value === null) return;
    setFieldHistory((prev) => {
      const history = prev[field] || [];
      // Evita duplicar se último valor for igual
      if (
        history.length &&
        JSON.stringify(history[history.length - 1].value) ===
          JSON.stringify(value)
      ) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...history, { value, timestamp: Date.now() }],
      };
    });
  };

  const toggleHistory = (field: FieldKey) => {
    setOpenHistory((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // (Implementações antigas substituídas por versões baseadas em setField/getField mais abaixo)
  // Helpers de acesso tipado aos campos do conteúdo gerado
  const setField = (
    obj: GeneratedContent,
    field: FieldKey,
    value: FieldValue
  ) => {
    switch (field) {
      case "TITULO_PRINCIPAL":
        if (typeof value === "string") obj.TITULO_PRINCIPAL = value;
        break;
      case "DESCRICAO_LEGENDA":
        if (typeof value === "string") obj.DESCRICAO_LEGENDA = value;
        break;
      case "HASHTAGS_TAGS":
        if (Array.isArray(value)) obj.HASHTAGS_TAGS = value;
        break;
      case "ROTEIRO":
        if (typeof value === "string") obj.ROTEIRO = value;
        break;
      case "TAGS_YOUTUBE":
        if (Array.isArray(value)) obj.TAGS_YOUTUBE = value;
        break;
      case "PALAVRAS_CHAVE_SEO":
        if (Array.isArray(value)) obj.PALAVRAS_CHAVE_SEO = value;
        break;
      case "TEXTO_THUMBNAIL":
        if (typeof value === "string") obj.TEXTO_THUMBNAIL = value;
        break;
      case "CTA_VARIANTES":
        if (Array.isArray(value)) obj.CTA_VARIANTES = value;
        break;
    }
  };

  const getField = (obj: GeneratedContent, field: FieldKey): FieldValue => {
    switch (field) {
      case "TITULO_PRINCIPAL":
        return obj.TITULO_PRINCIPAL;
      case "DESCRICAO_LEGENDA":
        return obj.DESCRICAO_LEGENDA;
      case "HASHTAGS_TAGS":
        return obj.HASHTAGS_TAGS;
      case "ROTEIRO":
        return obj.ROTEIRO;
      case "TAGS_YOUTUBE":
        return obj.TAGS_YOUTUBE;
      case "PALAVRAS_CHAVE_SEO":
        return obj.PALAVRAS_CHAVE_SEO;
      case "TEXTO_THUMBNAIL":
        return obj.TEXTO_THUMBNAIL;
      case "CTA_VARIANTES":
        return obj.CTA_VARIANTES;
    }
  };

  const restoreField = (field: FieldKey, value: FieldValue) => {
    if (!generatedContent) return;
    setGeneratedContent((prev) => {
      if (!prev) return prev;
      const clone: GeneratedContent = { ...prev };
      setField(clone, field, value);
      return clone;
    });
    push({ message: `Campo ${field} restaurado`, type: "info" });
  };

  const updateSingleField = (
    field: FieldKey,
    newValue: FieldValue,
    extras?: { TITULOS_ALTERNATIVOS?: string[] }
  ) => {
    if (!generatedContent) return;
    saveFieldHistory(field, getField(generatedContent, field));
    setGeneratedContent((prev) => {
      if (!prev) return prev;
      const clone: GeneratedContent = { ...prev };
      setField(clone, field, newValue);
      if (field === "TITULO_PRINCIPAL" && extras?.TITULOS_ALTERNATIVOS) {
        clone.TITULOS_ALTERNATIVOS = extras.TITULOS_ALTERNATIVOS;
      }
      return clone;
    });
    // Atualiza campos modificados comparando com baseline
    setModifiedFields((prev) => {
      const next = new Set(prev);
      if (originalContent) {
        const baselineVal = getField(originalContent, field);
        if (JSON.stringify(baselineVal) !== JSON.stringify(newValue)) {
          next.add(field);
        } else {
          next.delete(field);
        }
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const canUseRefinement = user?.plan !== "free";

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagem: file }));

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imagemPreview: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helpers de UI / Export
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      push({ message: "Copiado para área de transferência", type: "success" });
    });
  };

  const exportContent = () => {
    if (!generatedContent) return;
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conteudo.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToSpreadsheet = () => {
    if (!generatedContent) return;
    // Conversão simples CSV (chave;valor). Arrays join por vírgula.
    const lines: string[] = ["CAMPO;VALOR"];
    Object.entries(generatedContent).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      const val = Array.isArray(v) ? v.join(", ") : String(v);
      lines.push(`${k};"${val.replace(/"/g, '""')}"`);
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conteudo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!formData.tema.trim()) return;
    try {
      let imagemBase64: string | undefined;
      if (formData.imagem) {
        imagemBase64 = await convertImageToBase64(formData.imagem);
      }
      const request: GenerationRequest = {
        PLATAFORMA_ALVO: formData.plataforma,
        TEMA_PRINCIPAL: formData.tema,
        PALAVRAS_CHAVE_FOCO: formData.palavrasChave,
        TOM_DE_VOZ: formData.tom,
        DURACAO_ESTIMADA_VIDEO: formData.duracao,
        LINGUA_ALVO: formData.lingua,
        IMAGEM_BASE64: imagemBase64,
      };
      const result = await generateContent(request as GenerationRequest);
      const meta = result as unknown as {
        _fallback?: boolean;
        _modelsTried?: string[];
      };
      setLastResponseMeta({
        _fallback: meta?._fallback,
        _modelsTried: meta?._modelsTried,
      });
      if (meta?._fallback) {
        push({
          message: "IA fallback (mock) usado. Verifique quota ou modelo.",
          type: "error",
        });
      } else {
        push({ message: "Conteúdo gerado com sucesso 🚀", type: "success" });
      }
      if (result) {
        setGeneratedContent(result as GeneratedContent);
        setOriginalContent(result as GeneratedContent); // baseline
        setFieldHistory({});
        setModifiedFields(new Set());
      }
    } catch (e) {
      console.error("Erro ao gerar conteúdo", e);
      push({ message: "Erro ao gerar conteúdo", type: "error" });
    }
  };

  const handleRegenerate = async () => {
    if (!formData.tema.trim()) return;
    try {
      let imagemBase64: string | undefined;
      if (formData.imagem) {
        imagemBase64 = await convertImageToBase64(formData.imagem);
      }
      const variationSeed = Math.random().toString(36).slice(2, 10);
      const request: GenerationRequest = {
        TIPO_DE_ACAO: "REGENERAR_VARIACAO",
        PLATAFORMA_ALVO: formData.plataforma,
        TEMA_PRINCIPAL: formData.tema,
        PALAVRAS_CHAVE_FOCO: formData.palavrasChave,
        TOM_DE_VOZ: formData.tom,
        DURACAO_ESTIMADA_VIDEO: formData.duracao,
        LINGUA_ALVO: formData.lingua,
        IMAGEM_BASE64: imagemBase64,
        CONTEUDO_EXISTENTE: generatedContent || undefined,
        NOVA_INSTRUCAO: "Gerar variação diferente. Seed:" + variationSeed,
      };
      const content = await generateContent(request);
      if (content) {
        setGeneratedContent(content);
        setOriginalContent(content); // redefine baseline em nova variação
        setFieldHistory({});
        setModifiedFields(new Set());
      }
    } catch (e) {
      console.error("Erro ao regenerar conteúdo", e);
    }
  };

  // Refina um único campo usando ação unificada REFINAR_CAMPO
  const handleRefineField = async (field: FieldKey) => {
    if (!generatedContent || !canUseRefinement) return;
    setRefiningField(field);
    try {
      const req: GenerationRequest = {
        TIPO_DE_ACAO: "REFINAR_CAMPO",
        CAMPO_ALVO: field,
        PLATAFORMA_ALVO: formData.plataforma,
        CONTEUDO_EXISTENTE: generatedContent,
        NOVA_INSTRUCAO: customInstruction,
        TEMA_PRINCIPAL: formData.tema,
        PALAVRAS_CHAVE_FOCO: formData.palavrasChave,
        TOM_DE_VOZ: formData.tom,
        DURACAO_ESTIMADA_VIDEO: formData.duracao,
        LINGUA_ALVO: formData.lingua,
      };
      const partial = (await generateContent(req)) as
        | Partial<GeneratedContent>
        | undefined;
      if (partial) {
        // Se backend retornar objeto completo substituímos; se retornar somente campo, mesclamos
        if (
          partial &&
          (partial.TITULO_PRINCIPAL ||
            partial.ROTEIRO ||
            partial.DESCRICAO_LEGENDA ||
            partial.HASHTAGS_TAGS)
        ) {
          const anyPartial = partial as Record<string, unknown>;
          if (anyPartial[field] !== undefined) {
            const newVal = anyPartial[field] as FieldValue;
            updateSingleField(field, newVal);
          } else if (partial.TITULO_PRINCIPAL && field === "TITULO_PRINCIPAL") {
            updateSingleField("TITULO_PRINCIPAL", partial.TITULO_PRINCIPAL, {
              TITULOS_ALTERNATIVOS: partial.TITULOS_ALTERNATIVOS,
            });
          } else {
            if (anyPartial[field] !== undefined) {
              const newVal2 = anyPartial[field] as FieldValue;
              updateSingleField(field, newVal2);
            }
          }
        }
        push({ message: `Campo ${field} refinado`, type: "success" });
      }
      setCustomInstruction("");
    } catch (e) {
      console.error("Erro ao refinar campo", e);
      push({ message: "Erro ao refinar campo", type: "error" });
    } finally {
      setRefiningField(null);
    }
  };

  // (Função de refino individual via ação direta removida do fluxo principal; refinamento por campo usa modal padrão)

  const handleBatchRefine = async () => {
    // Usa campos marcados no diálogo de batch (reaproveitando exportFields por enquanto)
    const fields = (Object.keys(exportFields) as string[]).filter(
      (k) => exportFields[k as keyof typeof exportFields]
    );
    if (!fields.length) {
      push({
        message: "Selecione ao menos um campo para refinar.",
        type: "error",
      });
      return;
    }
    push({ message: "Refinando em lote...", type: "info" });
    try {
      const result = (await generateContent({
        ...formData,
        TIPO_DE_ACAO: "REFINAR_LOTE",
        CAMPOS_ALVO: fields,
        NOVA_INSTRUCAO: batchInstruction,
        CONTEUDO_EXISTENTE: generatedContent,
        LINGUA_ALVO: formData.lingua,
      } as unknown as GenerationRequest)) as unknown as Record<
        string,
        FieldValue
      >;
      setGeneratedContent((prev) => {
        if (!prev) return prev;
        const upd = { ...prev };
        fields.forEach((f) => {
          const val = result[f];
          if (val !== undefined) {
            saveFieldHistory(f as FieldKey, getField(prev, f as FieldKey));
            setField(upd, f as FieldKey, val);
            setModifiedFields((old) => new Set(old).add(f as FieldKey));
          }
        });
        return upd;
      });
      push({ message: "Lote refinado com sucesso", type: "success" });
    } catch {
      push({ message: "Erro ao refinar lote", type: "error" });
    }
    setBatchRefineOpen(false);
  };

  const openExport = () => setExportDialogOpen(true);
  const doExport = (format: "json" | "csv") => {
    if (!generatedContent) return;
    const filtered: Record<string, unknown> = {};
    (Object.keys(exportFields) as (keyof typeof exportFields)[]).forEach(
      (k) => {
        if (exportFields[k]) {
          const val = (generatedContent as unknown as Record<string, unknown>)[
            k
          ];
          if (val !== undefined) filtered[k as string] = val;
        }
      }
    );
    if (format === "json") {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "conteudo.json";
      a.click();
    } else {
      const lines: string[] = [];
      Object.entries(filtered).forEach(([k, v]) => {
        const val = Array.isArray(v)
          ? v.join(" | ")
          : (v ?? "").toString().replace(/\r?\n+/g, " ");
        lines.push(`"${k}","${val.replace(/"/g, '""')}"`);
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "conteudo.csv";
      a.click();
    }
    push({ message: `Exportado (${format.toUpperCase()})`, type: "success" });
    setExportDialogOpen(false);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "YouTube":
        return <Youtube className="h-4 w-4" />;
      case "TikTok":
        return <Music className="h-4 w-4" />;
      case "Instagram Reels":
        return <Instagram className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "YouTube":
        return "text-red-600 bg-red-100";
      case "TikTok":
        return "text-black bg-gray-100";
      case "Instagram Reels":
        return "text-pink-600 bg-pink-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Input Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            Informações do Conteúdo
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma Alvo *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["YouTube", "TikTok", "Instagram Reels"] as const).map(
                  (platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, plataforma: platform })
                      }
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                        formData.plataforma === platform
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${getPlatformColor(
                          platform
                        )}`}
                      >
                        {getPlatformIcon(platform)}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {platform === "Instagram Reels" ? "IG Reels" : platform}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema Principal *
              </label>
              <input
                type="text"
                value={formData.tema}
                onChange={(e) =>
                  setFormData({ ...formData, tema: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Como investir em ações para iniciantes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.palavrasChave}
                onChange={(e) =>
                  setFormData({ ...formData, palavrasChave: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: ações, investidor, iniciante, bolsa de valores"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem de Referência (Opcional)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.imagemPreview && (
                  <div className="relative">
                    <img
                      src={formData.imagemPreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          imagem: null,
                          imagemPreview: "",
                        }))
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tom de Voz
              </label>
              <select
                value={formData.tom}
                onChange={(e) =>
                  setFormData({ ...formData, tom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="informativo-entusiasmado">
                  Informativo e Entusiasmado
                </option>
                <option value="casual-amigavel">Casual e Amigável</option>
                <option value="profissional-autoritativo">
                  Profissional e Autoritativo
                </option>
                <option value="divertido-energetico">
                  Divertido e Energético
                </option>
                <option value="viral-provocativo">Viral e Provocativo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select
                value={formData.lingua}
                onChange={(e) =>
                  setFormData({ ...formData, lingua: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español (ES)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração Estimada
              </label>
              <select
                value={formData.duracao}
                onChange={(e) =>
                  setFormData({ ...formData, duracao: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {formData.plataforma === "YouTube" ? (
                  <>
                    <option value="3-minutos">3 minutos</option>
                    <option value="5-minutos">5 minutos</option>
                    <option value="10-minutos">10 minutos</option>
                    <option value="15-minutos">15+ minutos</option>
                  </>
                ) : (
                  <>
                    <option value="15-segundos">15 segundos</option>
                    <option value="30-segundos">30 segundos</option>
                    <option value="60-segundos">60 segundos</option>
                    <option value="90-segundos">90 segundos</option>
                  </>
                )}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generationLoading || !formData.tema.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generationLoading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Gerando conteúdo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Conteúdo
                </>
              )}
            </button>

            {generationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{generationError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Counter */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Uso Atual - Plano{" "}
                  {user.plan === "free"
                    ? "Starter"
                    : user.plan === "pro"
                    ? "Pro"
                    : "Prime"}
                </p>
                <p className="text-xs text-blue-700">
                  {user.plan === "free"
                    ? `${user.usage_count}/2 gerações esta semana`
                    : user.plan === "pro"
                    ? `${user.usage_count}/50 gerações este mês`
                    : "Gerações ilimitadas"}
                </p>
              </div>
              {user.plan === "free" && user.usage_count >= 2 && (
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors">
                  Fazer Upgrade
                </button>
              )}
            </div>
          </div>
        )}

        {/* Refinement Notice for Free Users */}
        {user?.plan === "free" && generatedContent && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start">
              <Wand2 className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">
                  🔒 Refino de Conteúdo - Recurso Premium
                </h4>
                <p className="text-xs text-amber-700 mb-3">
                  Refine títulos, roteiros e descrições com instruções
                  personalizadas. Disponível nos planos Pro (R$ 50/mês) e Prime
                  (R$ 150/mês).
                </p>
                <button className="text-xs bg-amber-600 text-white px-3 py-1 rounded-full hover:bg-amber-700 transition-colors">
                  Fazer Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Content */}
      <div className="space-y-6">
        {generatedContent ? (
          <>
            {/* Refinamento Individual de Campo */}
            {refiningField && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Refinar:{" "}
                  {refiningField === "TITULO_PRINCIPAL"
                    ? "Título Principal"
                    : refiningField === "DESCRICAO_LEGENDA"
                    ? "Descrição/Legenda"
                    : refiningField === "HASHTAGS_TAGS"
                    ? "Tags/Hashtags"
                    : refiningField === "ROTEIRO"
                    ? "Roteiro"
                    : refiningField}
                </h4>
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg mb-2"
                  placeholder="Ex: Mais provocativo, focar em resultado, usar emoji, etc."
                />
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                    onClick={() => handleRefineField(refiningField)}
                  >
                    Gerar Novo
                  </button>
                  <button
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 font-medium"
                    onClick={() => {
                      setRefiningField(null);
                      setCustomInstruction("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Generated Content Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">
                    Conteúdo Gerado
                  </h3>
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(
                      generatedContent.PLATAFORMA_ALVO_GERADA
                    )}`}
                  >
                    {getPlatformIcon(generatedContent.PLATAFORMA_ALVO_GERADA)}
                    <span className="ml-1">
                      {generatedContent.PLATAFORMA_ALVO_GERADA}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={generationLoading}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center"
                    title="Gerar novo conteúdo"
                  >
                    {generationLoading ? (
                      <Loader className="animate-spin h-3 w-3 mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Novo Conteúdo
                  </button>
                  <span
                    role="button"
                    onClick={exportToSpreadsheet}
                    className="p-2 cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Exportar para Planilha"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    onClick={exportContent}
                    className="p-2 cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Exportar JSON"
                  >
                    <Download className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(generatedContent, null, 2))
                    }
                    className="p-2 cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar Tudo"
                  >
                    <Copy className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    className="p-2 cursor-pointer text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Salvar (não implementado)"
                  >
                    <Save className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {generatedContent.PLATAFORMA_ALVO_GERADA === "YouTube"
                        ? "Título Principal"
                        : "Gancho Principal"}
                      {modifiedFields.has("TITULO_PRINCIPAL") && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Refinado
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedContent.TITULO_PRINCIPAL)
                      }
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Copiar
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                        onClick={() => setRefiningField("TITULO_PRINCIPAL")}
                      >
                        Refinar
                      </button>
                      {safeHistory("TITULO_PRINCIPAL").length > 0 && (
                        <button
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                          onClick={() => toggleHistory("TITULO_PRINCIPAL")}
                        >
                          Histórico ({safeHistory("TITULO_PRINCIPAL").length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-800 font-medium">
                      {generatedContent.TITULO_PRINCIPAL}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {generatedContent.TITULO_PRINCIPAL.length} caracteres
                    </p>
                  </div>
                  {openHistory.TITULO_PRINCIPAL && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">
                        Histórico de versões:
                      </h5>
                      <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {safeHistory("TITULO_PRINCIPAL")
                          .slice()
                          .reverse()
                          .map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                            >
                              <span
                                className="truncate flex-1"
                                title={normalizeHistoryValue(item.value)}
                              >
                                {normalizeHistoryValue(item.value)}
                              </span>
                              <span className="text-gray-400">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() =>
                                  restoreField("TITULO_PRINCIPAL", item.value)
                                }
                              >
                                Restaurar
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {generatedContent.TITULOS_ALTERNATIVOS.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Alternativas
                      </h5>
                      <div className="space-y-2">
                        {generatedContent.TITULOS_ALTERNATIVOS.map(
                          (title, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-2 rounded text-sm text-gray-700 flex items-center justify-between"
                            >
                              <span>{title}</span>
                              <button
                                onClick={() => copyToClipboard(title)}
                                className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                              >
                                Copiar
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {generatedContent.PLATAFORMA_ALVO_GERADA === "YouTube"
                        ? "Descrição"
                        : "Legenda"}
                      {modifiedFields.has("DESCRICAO_LEGENDA") && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Refinado
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedContent.DESCRICAO_LEGENDA)
                      }
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Copiar
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                        onClick={() => setRefiningField("DESCRICAO_LEGENDA")}
                      >
                        Refinar
                      </button>
                      {safeHistory("DESCRICAO_LEGENDA").length > 0 && (
                        <button
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                          onClick={() => toggleHistory("DESCRICAO_LEGENDA")}
                        >
                          Histórico ({safeHistory("DESCRICAO_LEGENDA").length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm">
                      {generatedContent.DESCRICAO_LEGENDA}
                    </p>
                  </div>
                  {openHistory.DESCRICAO_LEGENDA && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">
                        Histórico de versões:
                      </h5>
                      <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {safeHistory("DESCRICAO_LEGENDA")
                          .slice()
                          .reverse()
                          .map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                            >
                              <span
                                className="truncate flex-1"
                                title={normalizeHistoryValue(item.value)}
                              >
                                {normalizeHistoryValue(item.value).slice(0, 60)}
                                {normalizeHistoryValue(item.value).length > 60
                                  ? "…"
                                  : ""}
                              </span>
                              <span className="text-gray-400">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() =>
                                  restoreField("DESCRICAO_LEGENDA", item.value)
                                }
                              >
                                Restaurar
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Hashtags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {generatedContent.PLATAFORMA_ALVO_GERADA === "YouTube"
                        ? "Tags"
                        : "Hashtags"}
                      {modifiedFields.has("HASHTAGS_TAGS") && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Refinado
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedContent.HASHTAGS_TAGS.map(
                            (tag) => `#${tag}`
                          ).join(" ")
                        )
                      }
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Copiar
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                        onClick={() => setRefiningField("HASHTAGS_TAGS")}
                      >
                        Refinar
                      </button>
                      {safeHistory("HASHTAGS_TAGS").length > 0 && (
                        <button
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                          onClick={() => toggleHistory("HASHTAGS_TAGS")}
                        >
                          Histórico ({safeHistory("HASHTAGS_TAGS").length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.HASHTAGS_TAGS.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {openHistory.HASHTAGS_TAGS && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">
                        Histórico de versões:
                      </h5>
                      <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {safeHistory("HASHTAGS_TAGS")
                          .slice()
                          .reverse()
                          .map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                            >
                              <span
                                className="truncate flex-1"
                                title={normalizeHistoryValue(item.value)}
                              >
                                {normalizeHistoryValue(item.value)}
                              </span>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() =>
                                  restoreField("HASHTAGS_TAGS", item.value)
                                }
                              >
                                Restaurar
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Script */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      Roteiro{" "}
                      {modifiedFields.has("ROTEIRO") && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Refinado
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(generatedContent.ROTEIRO)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Copiar
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                        onClick={() => setRefiningField("ROTEIRO")}
                      >
                        Refinar
                      </button>
                      {safeHistory("ROTEIRO").length > 0 && (
                        <button
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                          onClick={() => toggleHistory("ROTEIRO")}
                        >
                          Histórico ({safeHistory("ROTEIRO").length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-96 overflow-y-auto">
                    <div
                      className="prose prose-sm text-gray-800 max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: generatedContent.ROTEIRO.replace(
                          /\n/g,
                          "<br />"
                        ),
                      }}
                    />
                  </div>
                  {openHistory.ROTEIRO && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">
                        Histórico de versões:
                      </h5>
                      <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {safeHistory("ROTEIRO")
                          .slice()
                          .reverse()
                          .map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                            >
                              <span
                                className="truncate flex-1"
                                title={normalizeHistoryValue(item.value)}
                              >
                                {normalizeHistoryValue(item.value).slice(0, 60)}
                                {normalizeHistoryValue(item.value).length > 60
                                  ? "…"
                                  : ""}
                              </span>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() =>
                                  restoreField("ROTEIRO", item.value)
                                }
                              >
                                Restaurar
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Key Points */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Pontos-Chave
                  </h4>
                  <ul className="space-y-2">
                    {generatedContent.PONTOS_CHAVE_DO_VIDEO.map(
                      (point, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-700 text-sm"
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                          {point}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Advanced YouTube Metadata (Conditional) */}
                {(generatedContent.TAGS_YOUTUBE?.length || 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Tags YouTube (Metadata)
                        {modifiedFields.has("TAGS_YOUTUBE") && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Refinado
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            (generatedContent.TAGS_YOUTUBE || []).join(", ")
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Copiar
                      </button>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                          onClick={() => setRefiningField("TAGS_YOUTUBE")}
                        >
                          Refinar
                        </button>
                        {safeHistory("TAGS_YOUTUBE").length > 0 && (
                          <button
                            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                            onClick={() => toggleHistory("TAGS_YOUTUBE")}
                          >
                            Histórico ({safeHistory("TAGS_YOUTUBE").length})
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.TAGS_YOUTUBE!.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {openHistory.TAGS_YOUTUBE && (
                      <div className="mt-2">
                        <h5 className="text-xs font-semibold text-gray-700 mb-1">
                          Histórico de versões:
                        </h5>
                        <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {safeHistory("TAGS_YOUTUBE")
                            .slice()
                            .reverse()
                            .map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                              >
                                <span
                                  className="truncate flex-1"
                                  title={normalizeHistoryValue(item.value)}
                                >
                                  {normalizeHistoryValue(item.value)}
                                </span>
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() =>
                                    restoreField("TAGS_YOUTUBE", item.value)
                                  }
                                >
                                  Restaurar
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {(generatedContent.PALAVRAS_CHAVE_SEO?.length || 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Palavras-Chave SEO
                        {modifiedFields.has("PALAVRAS_CHAVE_SEO") && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Refinado
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            (generatedContent.PALAVRAS_CHAVE_SEO || []).join(
                              ", "
                            )
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                            onClick={() =>
                              setRefiningField("PALAVRAS_CHAVE_SEO")
                            }
                          >
                            Refinar
                          </button>
                          {safeHistory("PALAVRAS_CHAVE_SEO").length > 0 && (
                            <button
                              className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                              onClick={() =>
                                toggleHistory("PALAVRAS_CHAVE_SEO")
                              }
                            >
                              Histórico (
                              {safeHistory("PALAVRAS_CHAVE_SEO").length})
                            </button>
                          )}
                        </div>
                        Copiar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.PALAVRAS_CHAVE_SEO!.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    {openHistory.PALAVRAS_CHAVE_SEO && (
                      <div className="mt-2">
                        <h5 className="text-xs font-semibold text-gray-700 mb-1">
                          Histórico de versões:
                        </h5>
                        <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {safeHistory("PALAVRAS_CHAVE_SEO")
                            .slice()
                            .reverse()
                            .map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                              >
                                <span
                                  className="truncate flex-1"
                                  title={normalizeHistoryValue(item.value)}
                                >
                                  {normalizeHistoryValue(item.value)}
                                </span>
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() =>
                                    restoreField(
                                      "PALAVRAS_CHAVE_SEO",
                                      item.value
                                    )
                                  }
                                >
                                  Restaurar
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {generatedContent.TEXTO_THUMBNAIL && (
                  <div>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Texto Sugerido para Thumbnail
                        {modifiedFields.has("TEXTO_THUMBNAIL") && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Refinado
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            generatedContent.TEXTO_THUMBNAIL || ""
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Copiar
                      </button>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                          onClick={() => setRefiningField("TEXTO_THUMBNAIL")}
                        >
                          Refinar
                        </button>
                        {safeHistory("TEXTO_THUMBNAIL").length > 0 && (
                          <button
                            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                            onClick={() => toggleHistory("TEXTO_THUMBNAIL")}
                          >
                            Histórico ({safeHistory("TEXTO_THUMBNAIL").length})
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg inline-block">
                      <span className="text-sm font-semibold text-gray-800 tracking-wide">
                        {generatedContent.TEXTO_THUMBNAIL}
                      </span>
                    </div>
                    {openHistory.TEXTO_THUMBNAIL && (
                      <div className="mt-2">
                        <h5 className="text-xs font-semibold text-gray-700 mb-1">
                          Histórico de versões:
                        </h5>
                        <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {safeHistory("TEXTO_THUMBNAIL")
                            .slice()
                            .reverse()
                            .map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                              >
                                <span
                                  className="truncate flex-1"
                                  title={normalizeHistoryValue(item.value)}
                                >
                                  {normalizeHistoryValue(item.value)}
                                </span>
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() =>
                                    restoreField("TEXTO_THUMBNAIL", item.value)
                                  }
                                >
                                  Restaurar
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {(generatedContent.CTA_VARIANTES?.length || 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        CTA Variantes
                        {modifiedFields.has("CTA_VARIANTES") && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Refinado
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            (generatedContent.CTA_VARIANTES || []).join(" | ")
                          )
                        }
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Copiar
                      </button>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
                          onClick={() => setRefiningField("CTA_VARIANTES")}
                        >
                          Refinar
                        </button>
                        {safeHistory("CTA_VARIANTES").length > 0 && (
                          <button
                            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                            onClick={() => toggleHistory("CTA_VARIANTES")}
                          >
                            Histórico ({safeHistory("CTA_VARIANTES").length})
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {generatedContent.CTA_VARIANTES!.map((cta, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 p-2 rounded flex items-center justify-between text-sm text-gray-700"
                        >
                          <span>{cta}</span>
                          <button
                            onClick={() => copyToClipboard(cta)}
                            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                          >
                            Copiar
                          </button>
                        </div>
                      ))}
                    </div>
                    {openHistory.CTA_VARIANTES && (
                      <div className="mt-2">
                        <h5 className="text-xs font-semibold text-gray-700 mb-1">
                          Histórico de versões:
                        </h5>
                        <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {safeHistory("CTA_VARIANTES")
                            .slice()
                            .reverse()
                            .map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-100 rounded px-2 py-1 gap-2"
                              >
                                <span
                                  className="truncate flex-1"
                                  title={normalizeHistoryValue(item.value)}
                                >
                                  {normalizeHistoryValue(item.value)}
                                </span>
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() =>
                                    restoreField("CTA_VARIANTES", item.value)
                                  }
                                >
                                  Restaurar
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Add fallback banner near top of generated content section */}
            {generatedContent && (
              <div style={{ marginBottom: 12 }}>
                {lastResponseMeta._fallback && (
                  <div
                    style={{
                      background: "#fde68a",
                      color: "#92400e",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 13,
                      border: "1px solid #fbbf24",
                    }}
                  >
                    Modo fallback (mock). Verifique quota da API ou modelo.
                    Modelos testados:{" "}
                    {lastResponseMeta._modelsTried?.join(", ")}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Pronto para gerar conteúdo?
            </h3>
            <p className="text-gray-400">
              Selecione a plataforma, preencha as informações ao lado e clique
              em "Gerar Conteúdo" para criar títulos, roteiros e descrições
              otimizados para seu vídeo.
            </p>
          </div>
        )}

        {/* Add controls (place near export buttons or below generate): */}
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}
        >
          <button type="button" onClick={openExport}>
            Exportar campos
          </button>
          <button type="button" onClick={() => setBatchRefineOpen(true)}>
            Refinar em Lote
          </button>
        </div>

        {/* Export Dialog */}
        {exportDialogOpen && (
          <div style={dialogStyle}>
            <h4>Exportar Campos</h4>
            <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 8 }}>
              {Object.keys(exportFields).map((k) => (
                <label
                  key={k}
                  style={{ display: "flex", gap: 6, fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={exportFields[k]}
                    onChange={(e) =>
                      setExportFields((prev) => ({
                        ...prev,
                        [k]: e.target.checked,
                      }))
                    }
                  />
                  {k}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => doExport("json")}>JSON</button>
              <button onClick={() => doExport("csv")}>CSV</button>
              <button onClick={() => setExportDialogOpen(false)}>Fechar</button>
            </div>
          </div>
        )}

        {/* Batch Refine Dialog */}
        {batchRefineOpen && (
          <div style={dialogStyle}>
            <h4>Refinar em Lote</h4>
            <p style={{ fontSize: 12, marginTop: 0 }}>
              Os campos marcados na exportação serão refinados.
            </p>
            <textarea
              style={{ width: "100%", height: 90, fontSize: 13 }}
              placeholder="Ex: tornar mais provocativo, adicionar CTA mais forte, reduzir tamanho..."
              value={batchInstruction}
              onChange={(e) => setBatchInstruction(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                onClick={handleBatchRefine}
                disabled={!batchInstruction.trim()}
              >
                Aplicar
              </button>
              <button onClick={() => setBatchRefineOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
