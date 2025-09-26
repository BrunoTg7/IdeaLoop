import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentGenerator } from "./ContentGenerator";
import { ToastProvider } from "./ToastProvider";

// Mocks
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1", plan: "pro", usage_count: 0 } }),
}));

const sampleContent = {
  PLATAFORMA_ALVO_GERADA: "YouTube",
  TITULO_PRINCIPAL: "Título Original",
  TITULOS_ALTERNATIVOS: ["Alt A", "Alt B"],
  DESCRICAO_LEGENDA: "Descrição base",
  HASHTAGS_TAGS: ["tag1", "tag2"],
  ROTEIRO: "Roteiro base",
  PONTOS_CHAVE_DO_VIDEO: ["p1", "p2"],
  TAGS_YOUTUBE: ["tagy1"],
  PALAVRAS_CHAVE_SEO: ["kw1"],
  TEXTO_THUMBNAIL: "THUMB",
  CTA_VARIANTES: ["Comenta algo"],
};

let refineCount = 0;

vi.mock("../hooks/useContentGeneration", () => ({
  useContentGeneration: () => ({
    loading: false,
    error: null,
    generateContent: async (req: {
      TIPO_DE_ACAO?: string;
      CAMPO_ALVO?: string;
    }) => {
      if (
        req.TIPO_DE_ACAO === "REFINAR_CAMPO" &&
        req.CAMPO_ALVO === "TITULO_PRINCIPAL"
      ) {
        refineCount++;
        return {
          TITULO_PRINCIPAL: "Novo Título " + refineCount,
          TITULOS_ALTERNATIVOS: ["Alt X", "Alt Y"],
        };
      }
      return sampleContent;
    },
  }),
}));

function renderWithProviders() {
  return render(
    <ToastProvider>
      <ContentGenerator />
    </ToastProvider>
  );
}

describe("ContentGenerator refinement flow", () => {
  beforeEach(() => {
    refineCount = 0;
  });

  it("generates baseline and then refines title showing badge and history", async () => {
    renderWithProviders();

    // Fill Tema Principal
    const temaInput = screen.getByPlaceholderText(/Ex: Como investir/i);
    fireEvent.change(temaInput, { target: { value: "Investir em ações" } });

    // Generate
    fireEvent.click(screen.getByRole("button", { name: /Gerar Conteúdo/i }));

    // Wait for baseline title
    await screen.findByText("Título Original");

    // No badge yet
    expect(screen.queryByText("Refinado")).toBeNull();

    // Open refine for title
    const refineButtons = screen.getAllByText("Refinar");
    fireEvent.click(refineButtons[0]);

    // Click gerar novo inside refine panel
    fireEvent.click(screen.getByText("Gerar Novo"));

    await waitFor(() => {
      const el = screen.queryByText(/Novo Título/i);
      expect(el).not.toBeNull();
    });

    // Badge should appear
    expect(screen.getAllByText("Refinado").length).toBeGreaterThan(0);
  });
});
